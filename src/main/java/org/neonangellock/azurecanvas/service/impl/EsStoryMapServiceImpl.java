package org.neonangellock.azurecanvas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.es.EsStoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.model.storymap.StoryMapStats;
import org.neonangellock.azurecanvas.repository.StoryMapRepository;
import org.neonangellock.azurecanvas.repository.es.EsStoryMapRepository;
import org.neonangellock.azurecanvas.service.EsStoryMapService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.util.UUID;
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
                            .fields("title", "description", "location")
                            .query(keyword)))
                    .withPageable(PageRequest.of(page, size))
                    .withHighlightQuery(new HighlightQuery(
                            new Highlight(List.of(
                                    new HighlightField("title"),
                                    new HighlightField("description"),
                                    new HighlightField("location"))),
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
            log.info("Starting scheduled storymap sync from database");

            int pageNum = 1;
            while (true) {
                //Pageable pageable = PageRequest.of(pageNum, SYNC_BATCH_SIZE);
                List<StoryMap> storyMaps = storyMapService.findAllWithRange(pageNum, SYNC_BATCH_SIZE);

                if (storyMaps.isEmpty()) {
                    break;
                }

                List<EsStoryMap> esItems = convertStoryMapsToEsStoryMaps(storyMaps);
                int synced = syncBatchWithRetry(esItems);
                totalSynced += synced;

                log.debug("Synced batch {} with {} storymap locations", pageNum, synced);

                if (storyMaps.size() < SYNC_BATCH_SIZE) {
                    break;
                }
                pageNum++;
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed full storymap sync: {} location items in {}ms", totalSynced, duration);

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
            List<StoryMap> allStoryMaps = storyMapService.findAll();

            List<EsStoryMap> esItems = allStoryMaps.stream()
                    .filter(storyMap -> storyMap.getUpdatedAt() != null &&
                                        storyMap.getUpdatedAt().isAfter(syncSince))
                    .flatMap(storyMap -> convertStoryMapToEsStoryMaps(storyMap).stream())
                    .collect(Collectors.toList());

            if (!esItems.isEmpty()) {
                totalSynced = syncBatchWithRetry(esItems);
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed incremental storymap sync: {} location items in {}ms", totalSynced, duration);

        } catch (Exception e) {
            log.error("Failed to incrementally sync storymap: {}", e.getMessage(), e);
        } finally {
            isSyncing = false;
        }
    }

    private List<EsStoryMap> convertStoryMapsToEsStoryMaps(List<StoryMap> storyMaps) {
        List<EsStoryMap> esStoryMaps = new ArrayList<>();
        for (StoryMap storyMap : storyMaps) {
            esStoryMaps.addAll(convertStoryMapToEsStoryMaps(storyMap));
        }
        return esStoryMaps;
    }

    private List<EsStoryMap> convertStoryMapToEsStoryMaps(StoryMap storyMap) {
        List<EsStoryMap> esStoryMaps = new ArrayList<>();

        if (storyMap == null) {
            return esStoryMaps;
        }

        StoryMapStats stats = storyMap.getStats();
        int likes = stats != null ? stats.getLikesCount() : 0;
        int comments = stats != null ? stats.getCommentCount() : 0;

        List<StoryMapLocation> locations = storyMap.getLocations();
        if (locations == null || locations.isEmpty()) {
            EsStoryMap esItem = new EsStoryMap();
            esItem.setStoryMapId(storyMap.getStoryMapId().toString());
            esItem.setTitle(storyMap.getTitle());
            esItem.setDescription(storyMap.getContent());
            esItem.setCategory("storymap");
            esItem.setLocation("");
            esItem.setLat(0.0);
            esItem.setLng(0.0);
            esItem.setLikes(likes);
            esItem.setComments(comments);
            esItem.setAuthorID(storyMap.getAuthorId() != null ? storyMap.getAuthorId().toString() : "");
            esItem.setAuthor("");
            esItem.setCreatedAt(formatDateTime(storyMap.getCreatedAt()));
            esItem.setUpdatedAt(formatDateTime(storyMap.getUpdatedAt()));
            esStoryMaps.add(esItem);
        } else {
            for (StoryMapLocation location : locations) {
                EsStoryMap esItem = new EsStoryMap();
                esItem.setStoryMapId(storyMap.getStoryMapId().toString());
                esItem.setTitle(storyMap.getTitle());
                esItem.setDescription(location.getDescription() != null ? location.getDescription() : storyMap.getContent());
                esItem.setCategory("storymap");
                esItem.setLocation(location.getTitle() != null ? location.getTitle() : "");
                esItem.setLat(location.getLat() != null ? location.getLat().doubleValue() : 0.0);
                esItem.setLng(location.getLng() != null ? location.getLng().doubleValue() : 0.0);
                esItem.setLikes(likes);
                esItem.setComments(comments);
                esItem.setAuthorID(storyMap.getAuthorId() != null ? storyMap.getAuthorId().toString() : "");
                esItem.setAuthor("");
                esItem.setCreatedAt(formatDateTime(storyMap.getCreatedAt()));
                esItem.setUpdatedAt(formatDateTime(storyMap.getUpdatedAt()));
                esStoryMaps.add(esItem);
            }
        }

        return esStoryMaps;
    }

    private String formatDateTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_FORMATTER) : null;
    }

    private int syncBatchWithRetry(List<EsStoryMap> esItems) {
        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                if (elasticsearchOperations != null && esStoryMapRepository != null) {
                    esStoryMapRepository.saveAll(esItems);
                    return esItems.size();
                }
            } catch (Exception e) {
                attempts++;
                log.warn("Failed to sync storymap batch (attempt {}/{}): {}",
                        attempts, MAX_RETRIES, e.getMessage());
                if (attempts < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempts);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        return 0;
    }

    @Override
    public List<EsStoryMap> getAllStoryMaps(int page, int size) {
        try {
            if (elasticsearchOperations == null) {
                log.warn("Elasticsearch operations not available");
                return List.of();
            }

            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.matchAll(m -> m))
                    .withPageable(PageRequest.of(page, size))
                    .build();

            log.debug("Fetching all storymaps from ES, page: {}, size: {}", page, size);
            SearchHits<EsStoryMap> searchHits = elasticsearchOperations.search(query, EsStoryMap.class);
            return searchHits.getSearchHits().stream()
                    .map(hit -> hit.getContent())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get all storymaps from ES: {}", e.getMessage(), e);
            return List.of();
        }
    }

    private SearchHits<EsStoryMap> createEmptySearchHits() {
        return new EmptyStoryMapSearchHits();
    }

    private static class EmptyStoryMapSearchHits implements SearchHits<EsStoryMap> {
        @Override
        public long getTotalHits() { return 0; }
        @Override
        public org.springframework.data.elasticsearch.core.TotalHitsRelation getTotalHitsRelation() {
            return org.springframework.data.elasticsearch.core.TotalHitsRelation.EQUAL_TO;
        }
        @Override
        public float getMaxScore() { return 0f; }
        @Override
        public org.springframework.data.elasticsearch.core.suggest.response.Suggest getSuggest() { return null; }
        @Override
        public List<org.springframework.data.elasticsearch.core.SearchHit<EsStoryMap>> getSearchHits() {
            return List.of();
        }
        @Override
        public org.springframework.data.elasticsearch.core.SearchHit<EsStoryMap> getSearchHit(int index) {
            throw new IndexOutOfBoundsException();
        }

        public List<EsStoryMap> getSearchHitsContents() { return List.of(); }
        @Override
        public boolean hasSearchHits() { return false; }
        @Override
        public org.springframework.data.elasticsearch.core.AggregationsContainer<?> getAggregations() { return null; }

        public <A> A getAggregation(String name, Class<A> aClass) { return null; }
        @Override
        public org.springframework.data.elasticsearch.core.SearchShardStatistics getSearchShardStatistics() { return null; }
        @Override
        public String getPointInTimeId() { return null; }
        @Override
        public java.time.Duration getExecutionDuration() { return java.time.Duration.ZERO; }
    }
}
