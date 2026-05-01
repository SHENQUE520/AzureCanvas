package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.es.EsItem;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.List;

public interface EsItemService {
    SearchHits<EsItem> searchItems(String keyword, int page, int size);
    void syncItemsFromDb();
    void incrementalSyncItems();
}
