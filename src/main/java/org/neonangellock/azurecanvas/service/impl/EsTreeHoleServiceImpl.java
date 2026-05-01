package org.neonangellock.azurecanvas.service.impl;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.es.EsTreeHole;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.repository.es.EsTreeHoleRepository;
import org.neonangellock.azurecanvas.service.EsTreeHoleService;
import org.neonangellock.azurecanvas.service.TreeholeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EsTreeHoleServiceImpl implements EsTreeHoleService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter LOG_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private static final int SYNC_BATCH_SIZE = 100;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    @Value("${es.sync.full-rate-ms:300000}")
    private long fullSyncRateMs;

    @Value("${es.sync.incremental-cron:0 */15 * * * *}")
    private String incrementalSyncCron;

    @Autowired(required = false)
    private EsTreeHoleRepository esTreeHoleRepository;

    @Autowired(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    @Autowired
    private TreeholeService treeholeService;

    private volatile Date lastFullSyncTime = null;
    private volatile Date lastIncrementalSyncTime = null;
    private volatile boolean isSyncing = false;

    private final AtomicLong totalSyncCount = new AtomicLong(0);
    private final AtomicLong totalErrorCount = new AtomicLong(0);
    private final AtomicLong totalItemsSynced = new AtomicLong(0);

    @Override
    @Transactional
    public SearchHits<EsTreeHole> searchTreeHole(String keyword, int page, int size) {
        if (elasticsearchOperations == null) {
            log.warn("Elasticsearch operations not available");
            return createEmptySearchHits();
        }

        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(m -> m.fields("title", "content").query(keyword)))
                    .withPageable(PageRequest.of(page, size))
                    .withHighlightQuery(new HighlightQuery(
                            new Highlight(List.of(
                                    new HighlightField("title"),
                                    new HighlightField("content"))),
                            EsTreeHole.class))
                    .build();

            log.debug("Searching treehole in ES with keyword: {}", keyword);
            return elasticsearchOperations.search(query, EsTreeHole.class);
        } catch (Exception e) {
            log.error("Failed to search treehole in ES: {}", e.getMessage(), e);
            return createEmptySearchHits();
        }
    }

    @Override
    @Scheduled(fixedRateString = "${es.sync.full-rate-ms:300000}")
    public void syncTreeHoleFromDb() {
        if (isSyncing) {
            log.info("[ES-Sync] 全量同步已在进行中，跳过本次调度");
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        String taskId = "FULL-" + System.currentTimeMillis();
        int totalSynced = 0;

        log.info("[ES-Sync][{}] 开始全量同步树洞数据到ES (配置间隔: {}ms)", taskId, fullSyncRateMs);

        try {
            List<TreeholePost> allPosts = treeholeService.findAllPosts();
            int totalPosts = allPosts.size();
            log.info("[ES-Sync][{}] 数据库中共有 {} 条树洞帖子待同步", taskId, totalPosts);

            for (int i = 0; i < totalPosts; i += SYNC_BATCH_SIZE) {
                int endIndex = Math.min(i + SYNC_BATCH_SIZE, totalPosts);
                List<TreeholePost> batch = allPosts.subList(i, endIndex);

                List<EsTreeHole> esItems = batch.stream()
                        .map(this::convertToEsTreeHole)
                        .collect(Collectors.toList());

                int synced = syncBatchWithRetry(esItems, taskId);
                totalSynced += synced;

                if (log.isDebugEnabled()) {
                    log.debug("[ES-Sync][{}] 批次 {}/{} 同步完成，本批 {} 条", taskId, (i / SYNC_BATCH_SIZE) + 1, (totalPosts + SYNC_BATCH_SIZE - 1) / SYNC_BATCH_SIZE, synced);
                }
            }

            lastFullSyncTime = new Date();
            long duration = System.currentTimeMillis() - startTime;
            totalSyncCount.incrementAndGet();
            totalItemsSynced.addAndGet(totalSynced);

            log.info("[ES-Sync][{}] 全量同步完成: 总计 {} 条，耗时 {}ms，累计同步 {} 次/{} 条",
                    taskId, totalSynced, duration, totalSyncCount.get(), totalItemsSynced.get());

        } catch (Exception e) {
            totalErrorCount.incrementAndGet();
            log.error("[ES-Sync][{}] 全量同步失败: {} (累计错误: {} 次)",
                    taskId, e.getMessage(), totalErrorCount.get(), e);
        } finally {
            isSyncing = false;
        }
    }

    @Override
    @Scheduled(cron = "${es.sync.incremental-cron:0 */15 * * * *}")
    public void incrementalSyncTreeHole() {
        if (isSyncing) {
            log.info("[ES-Sync] 增量同步已在进行中，跳过本次调度");
            return;
        }

        if (lastFullSyncTime == null) {
            log.info("[ES-Sync] 尚未执行过全量同步，先执行全量同步");
            syncTreeHoleFromDb();
            return;
        }

        isSyncing = true;
        long startTime = System.currentTimeMillis();
        String taskId = "INC-" + System.currentTimeMillis();
        int totalSynced = 0;

        log.info("[ES-Sync][{}] 开始增量同步树洞数据 (cron: {})", taskId, incrementalSyncCron);

        try {
            List<TreeholePost> allPosts = treeholeService.findAllPosts();
            Date syncSince = lastFullSyncTime;

            List<EsTreeHole> esItems = allPosts.stream()
                    .filter(post -> post.getUpdatedAt() != null &&
                                    post.getUpdatedAt().after(syncSince))
                    .map(this::convertToEsTreeHole)
                    .collect(Collectors.toList());

            log.info("[ES-Sync][{}] 发现 {} 条增量更新数据 (自 {} 起)",
                    taskId, esItems.size(), lastFullSyncTime);

            if (!esItems.isEmpty()) {
                totalSynced = syncBatchWithRetry(esItems, taskId);
                totalItemsSynced.addAndGet(totalSynced);
            } else {
                log.info("[ES-Sync][{}] 无增量更新数据", taskId);
            }

            lastIncrementalSyncTime = new Date();
            long duration = System.currentTimeMillis() - startTime;
            totalSyncCount.incrementAndGet();

            log.info("[ES-Sync][{}] 增量同步完成: 同步 {} 条，耗时 {}ms",
                    taskId, totalSynced, duration);

        } catch (Exception e) {
            totalErrorCount.incrementAndGet();
            log.error("[ES-Sync][{}] 增量同步失败: {} (累计错误: {} 次)",
                    taskId, e.getMessage(), totalErrorCount.get(), e);
        } finally {
            isSyncing = false;
        }
    }

    private int syncBatchWithRetry(List<EsTreeHole> esItems, String taskId) {
        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                if (elasticsearchOperations != null && esTreeHoleRepository != null) {
                    esTreeHoleRepository.saveAll(esItems);
                    return esItems.size();
                }
            } catch (Exception e) {
                attempts++;
                log.warn("[ES-Sync][{}] 批次同步失败 (第 {}/{} 次): {}",
                        taskId, attempts, MAX_RETRIES, e.getMessage());
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

    public Map<String, Object> getSyncStatus() {
        Map<String, Object> status = new java.util.LinkedHashMap<>();
        status.put("lastFullSyncTime", lastFullSyncTime != null ? lastFullSyncTime.toInstant().toString() : "从未同步");
        status.put("lastIncrementalSyncTime", lastIncrementalSyncTime != null ? lastIncrementalSyncTime.toInstant().toString() : "从未同步");
        status.put("isSyncing", isSyncing);
        status.put("totalSyncCount", totalSyncCount.get());
        status.put("totalErrorCount", totalErrorCount.get());
        status.put("totalItemsSynced", totalItemsSynced.get());
        status.put("fullSyncRateMs", fullSyncRateMs);
        status.put("incrementalSyncCron", incrementalSyncCron);
        status.put("esAvailable", elasticsearchOperations != null && esTreeHoleRepository != null);
        return status;
    }

    private EsTreeHole convertToEsTreeHole(TreeholePost post) {
        EsTreeHole esTreeHole = new EsTreeHole();
        esTreeHole.setId(post.getId().toString());
        esTreeHole.setBoardName(post.getCategory() != null ? post.getCategory() : "树洞");
        esTreeHole.setTitle(post.getTitle() != null ? post.getTitle() : "");
        esTreeHole.setContent(post.getContent());
        return esTreeHole;
    }

    private SearchHits<EsTreeHole> createEmptySearchHits() {
        return new EmptyTreeHoleSearchHits();
    }

    private static class EmptyTreeHoleSearchHits implements SearchHits<EsTreeHole> {
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
        public List<org.springframework.data.elasticsearch.core.SearchHit<EsTreeHole>> getSearchHits() {
            return List.of();
        }
        @Override
        public org.springframework.data.elasticsearch.core.SearchHit<EsTreeHole> getSearchHit(int index) {
            throw new IndexOutOfBoundsException();
        }

        public List<EsTreeHole> getSearchHitsContents() { return List.of(); }
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
