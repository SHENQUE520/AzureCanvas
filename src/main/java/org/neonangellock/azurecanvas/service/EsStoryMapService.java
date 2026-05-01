package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.es.EsStoryMap;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.List;

public interface EsStoryMapService {
    SearchHits<EsStoryMap> searchStoryMap(String keyword, int page, int size);
    void syncStoryMapFromDb();
    void incrementalSyncStoryMap();
    List<EsStoryMap> getAllStoryMaps(int page, int size);
}
