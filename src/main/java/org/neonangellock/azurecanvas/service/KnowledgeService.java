package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.es.EsKnowledge;
import org.neonangellock.azurecanvas.repository.EsKnowledgeRepository;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KnowledgeService {
    private final ElasticsearchOperations elasticsearchOperations;
    private final EsKnowledgeRepository repository;

    public KnowledgeService(ElasticsearchOperations elasticsearchOperations, EsKnowledgeRepository repository) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.repository = repository;
    }

    public List<EsKnowledge> search(String keyword) {
        try {
            // 先不做关键词匹配，直接返回所有数据
            return (List<EsKnowledge>) repository.findAll();
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}