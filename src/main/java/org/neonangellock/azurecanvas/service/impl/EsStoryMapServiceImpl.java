package org.neonangellock.azurecanvas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.es.EsStoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.neonangellock.azurecanvas.repository.es.EsStoryMapRepository;
import org.neonangellock.azurecanvas.service.EsStoryMapService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@EnableScheduling
public class EsStoryMapServiceImpl implements EsStoryMapService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final int SYNC_BATCH_SIZE = 50;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    @Autowired(required = false)
    private EsStoryMapRepository esStoryMapRepository;

    @Autowired(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    @Autowired
    private IStoryMapService storyMapService;

    private volatile OffsetDateTime lastFullSyncTime = null;
    private volatile boolean isSyncing = false;

    @Override
    @Transactional(readOnly = true)
    public SearchHits<EsStoryMap> searchStoryMap(String keyword, int page, int size) {
        if (elasticsearchOperations == null) {
            log.warn("Elasticsearch operations not available");
            return createEmptySearchHits();
        }

        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(m -> m
                            .fields("title", "description", "location", "titleEn", "descriptionEn", "locationEn",
                                    "titleZh", "descriptionZh", "locationZh")
                            .query(keyword)))
                    .withPageable(PageRequest.of(page, size))
                    .withHighlightQuery(new HighlightQuery(
                            new Highlight(List.of(
                                    new HighlightField("title"),
                                    new HighlightField("description"),
                                    new HighlightField("location"),
                                    new HighlightField("titleEn"),
                                    new HighlightField("descriptionEn"),
                                    new HighlightField("locationEn"),
                                    new HighlightField("titleZh"),
                                    new HighlightField("descriptionZh"),
                                    new HighlightField("locationZh"))),
                            EsStoryMap.class))
                    .build();

            log.debug("Searching storymap in ES with keyword: {}", keyword);
            return elasticsearchOperations.search(query, EsStoryMap.class);
        } catch (Exception e) {
            log.error("Failed to search storymap in ES: {}", e.getMessage(), e);
            return createEmptySearchHits();
        }
    }

    @Override
    @Scheduled(fixedRate = 600000)
    @Transactional(readOnly = true)
    public void syncStoryMapFromDb() {
        if (isSyncing) {
            log.info("Sync already in progress, skipping...");
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        int totalSynced = 0;

        try {
            int pageNum = 1;
            while (true) {
                List<StoryMapCombined> storyMaps = storyMapService.findAllWithRange(pageNum, SYNC_BATCH_SIZE);

                if (storyMaps.isEmpty()) {
                    break;
                }

                List<EsStoryMap> esItems = convertStoryMapsToEsStoryMaps(storyMaps);
                int synced = syncBatchWithRetry(esItems);
                totalSynced += synced;

                log.debug("Synced batch {} with {} storymap items", pageNum, synced);

                if (storyMaps.size() < SYNC_BATCH_SIZE) {
                    break;
                }
                pageNum++;
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed full storymap sync: {} items in {}ms", totalSynced, duration);

        } catch (Exception e) {
            log.error("Failed to sync storymap from database: {}", e.getMessage(), e);
        } finally {
            isSyncing = false;
        }
    }

    @Override
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional(readOnly = true)
    public void incrementalSyncStoryMap() {
        if (isSyncing) {
            log.info("Sync already in progress, skipping incremental sync");
            return;
        }

        if (lastFullSyncTime == null) {
            log.info("No previous sync time found, performing full sync");
            syncStoryMapFromDb();
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        int totalSynced = 0;

        try {
            log.info("Starting incremental storymap sync since {}", lastFullSyncTime);

            OffsetDateTime syncSince = lastFullSyncTime.minusMinutes(30);
            List<StoryMapCombined> allStoryMaps = storyMapService.findAll();

            List<EsStoryMap> esItems = allStoryMaps.stream()
                    .filter(storyMap -> storyMap.getUpdatedAt() != null &&
                            storyMap.getUpdatedAt().isAfter(syncSince))
                    .map(this::convertStoryMapToEsStoryMap)
                    .collect(Collectors.toList());

            if (!esItems.isEmpty()) {
                totalSynced = syncBatchWithRetry(esItems);
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed incremental storymap sync: {} items in {}ms", totalSynced, duration);

        } catch (Exception e) {
            log.error("Failed to incrementally sync storymap: {}", e.getMessage(), e);
        } finally {
            isSyncing = false;
        }
    }

    private List<EsStoryMap> convertStoryMapsToEsStoryMaps(List<StoryMapCombined> storyMaps) {
        return storyMaps.stream().map(this::convertStoryMapToEsStoryMap).collect(Collectors.toList());
    }

    private EsStoryMap convertStoryMapToEsStoryMap(StoryMapCombined storyMap) {
        EsStoryMap esItem = new EsStoryMap();
        esItem.setStoryMapId(storyMap.getStoryMapId().toString());
        esItem.setTitle(storyMap.getTitle());
        esItem.setDescription(storyMap.getContent());
        esItem.setLocation(storyMap.getLocationTitle());
        esItem.setTitleEn(storyMap.getTitle());
        esItem.setDescriptionEn(storyMap.getContent());
        esItem.setLocationEn(storyMap.getLocationTitle());
        esItem.setTitleZh(storyMap.getTitle());
        esItem.setDescriptionZh(storyMap.getContent());
        esItem.setLocationZh(storyMap.getLocationTitle());
        esItem.setLat(storyMap.getLat().doubleValue());
        esItem.setLng(storyMap.getLng().doubleValue());
        esItem.setLikes(storyMap.getLikesCount());
        esItem.setComments(storyMap.getCommentCount());
        esItem.setAuthorID(storyMap.getAuthorId().toString());
        esItem.setCreatedAt(storyMap.getCreatedAt().format(DATE_FORMATTER));
        esItem.setUpdatedAt(storyMap.getUpdatedAt().format(DATE_FORMATTER));
        return esItem;
    }

    @Override
    public List<EsStoryMap> getAllStoryMaps(int page, int size) {
        if (esStoryMapRepository == null)
            return new ArrayList<>();
        return esStoryMapRepository.findAll(PageRequest.of(page, size)).getContent();
    }

    private int syncBatchWithRetry(List<EsStoryMap> items) {
        if (esStoryMapRepository == null)
            return 0;

        int retryCount = 0;
        while (retryCount < MAX_RETRIES) {
            try {
                esStoryMapRepository.saveAll(items);
                return items.size();
            } catch (Exception e) {
                retryCount++;
                log.error("Failed to sync batch (attempt {}/{}): {}", retryCount, MAX_RETRIES, e.getMessage());
                if (retryCount < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        return 0;
    }

    private SearchHits<EsStoryMap> createEmptySearchHits() {
        return null; // Or return an empty implementation
    }
}
