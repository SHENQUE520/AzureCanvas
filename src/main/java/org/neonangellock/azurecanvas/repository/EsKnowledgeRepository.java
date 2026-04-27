package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.es.EsKnowledge;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface EsKnowledgeRepository extends ElasticsearchRepository<EsKnowledge, String> {
}