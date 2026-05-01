package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.es.EsTreeHole;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.Map;

public interface EsTreeHoleService {
    SearchHits<EsTreeHole> searchTreeHole(String keyword, int page, int size);
    void syncTreeHoleFromDb();
    void incrementalSyncTreeHole();
    Map<String, Object> getSyncStatus();
}
