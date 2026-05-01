package org.neonangellock.azurecanvas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.es.EsItem;
import org.neonangellock.azurecanvas.repository.ItemRepository;
import org.neonangellock.azurecanvas.repository.es.EsItemRepository;
import org.neonangellock.azurecanvas.service.EsItemService;
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
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@EnableScheduling
public class EsItemServiceImpl implements EsItemService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final int SYNC_BATCH_SIZE = 100;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired(required = false)
    private EsItemRepository esItemRepository;

    @Autowired(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    private OffsetDateTime lastFullSyncTime = null;
    private volatile boolean isSyncing = false;

    @Override
    @Transactional(readOnly = true)
    public SearchHits<EsItem> searchItems(String keyword, int page, int size) {
        if (elasticsearchOperations == null) {
            log.warn("Elasticsearch operations not available");
            return createEmptySearchHits();
        }

        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(m -> m.fields("title", "description").query(keyword)))
                    .withPageable(PageRequest.of(page, size))
                    .withHighlightQuery(new HighlightQuery(
                            new Highlight(List.of(
                                    new HighlightField("title"),
                                    new HighlightField("description"))),
                            EsItem.class))
                    .build();

            log.debug("Searching items in ES with keyword: {}", keyword);
            return elasticsearchOperations.search(query, EsItem.class);
        } catch (Exception e) {
            log.error("Failed to search items in ES: {}", e.getMessage(), e);
            return createEmptySearchHits();
        }
    }

    @Override
    @Scheduled(fixedRate = 300000)
    @Transactional(readOnly = true)
    public void syncItemsFromDb() {
        if (isSyncing) {
            log.info("Sync already in progress, skipping...");
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        int totalSynced = 0;
        int pageNum = 0;

        try {
            log.info("Starting scheduled item sync from database");

            while (true) {
                Pageable pageable = PageRequest.of(pageNum, SYNC_BATCH_SIZE);
                Page<Item> itemPage = itemRepository.findAll(pageable);

                if (itemPage.isEmpty()) {
                    break;
                }

                List<EsItem> esItems = itemPage.getContent().stream()
                        .map(this::convertToEsItem)
                        .collect(Collectors.toList());

                int synced = syncBatchWithRetry(esItems);
                totalSynced += synced;

                log.debug("Synced batch {} with {} items", pageNum, synced);

                if (!itemPage.hasNext()) {
                    break;
                }
                pageNum++;
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed full item sync: {} items in {}ms", totalSynced, duration);

        } catch (Exception e) {
            log.error("Failed to sync items from database: {}", e.getMessage(), e);
        } finally {
            isSyncing = false;
        }
    }

    @Override
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional(readOnly = true)
    public void incrementalSyncItems() {
        if (isSyncing) {
            log.info("Sync already in progress, skipping incremental sync");
            return;
        }

        if (lastFullSyncTime == null) {
            log.info("No previous sync time found, performing full sync");
            syncItemsFromDb();
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        int totalSynced = 0;

        try {
            log.info("Starting incremental item sync since {}", lastFullSyncTime);

            OffsetDateTime syncSince = lastFullSyncTime.minusMinutes(5);
            int pageNum = 0;

            while (true) {
                Pageable pageable = PageRequest.of(pageNum, SYNC_BATCH_SIZE);
                Page<Item> itemPage = itemRepository.findAll(pageable);

                if (itemPage.isEmpty()) {
                    break;
                }

                List<EsItem> esItems = itemPage.getContent().stream()
                        .filter(item -> item.getUpdatedAt() != null &&
                                        item.getUpdatedAt().isAfter(syncSince))
                        .map(this::convertToEsItem)
                        .collect(Collectors.toList());

                if (!esItems.isEmpty()) {
                    int synced = syncBatchWithRetry(esItems);
                    totalSynced += synced;
                }

                if (!itemPage.hasNext()) {
                    break;
                }
                pageNum++;
            }

            lastFullSyncTime = OffsetDateTime.now();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed incremental item sync: {} items in {}ms", totalSynced, duration);

        } catch (Exception e) {
            log.error("Failed to incrementally sync items: {}", e.getMessage(), e);
        } finally {
            isSyncing = false;
        }
    }

    private int syncBatchWithRetry(List<EsItem> esItems) {
        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                if (elasticsearchOperations != null && esItemRepository != null) {
                    esItemRepository.saveAll(esItems);
                    return esItems.size();
                }
            } catch (Exception e) {
                attempts++;
                log.warn("Failed to sync batch (attempt {}/{}): {}",
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

    private EsItem convertToEsItem(Item item) {
        EsItem esItem = new EsItem();
        esItem.setId(item.getItemId().toString());
        esItem.setTitle(item.getTitle());
        esItem.setDescription(item.getDescription());
        esItem.setPrice(item.getPrice());
        esItem.setCategory(item.getCategory());
        esItem.setStatus(item.getStatus());
        esItem.setLocation(item.getLocation());
        esItem.setViews(item.getViews());
        esItem.setQuality(item.getQuality());
        esItem.setUrgent(item.isUrgent());
        esItem.setFreeShipping(item.isFreeShipping());
        esItem.setCanInspect(item.isCanInspect());
        if (item.getCreatedAt() != null) {
            esItem.setCreatedAt(item.getCreatedAt().format(DATE_FORMATTER));
        }
        return esItem;
    }

    private SearchHits<EsItem> createEmptySearchHits() {
        return new EmptySearchHits<>();
    }

    private static class EmptySearchHits<T> implements SearchHits<T> {
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
        public List<org.springframework.data.elasticsearch.core.SearchHit<T>> getSearchHits() {
            return List.of();
        }
        @Override
        public org.springframework.data.elasticsearch.core.SearchHit<T> getSearchHit(int index) {
            throw new IndexOutOfBoundsException();
        }
        public List<T> getSearchHitsContents() { return List.of(); }
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
