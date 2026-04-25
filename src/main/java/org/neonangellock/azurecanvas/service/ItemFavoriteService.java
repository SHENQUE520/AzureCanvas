package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemFavorite;

import java.util.List;
import java.util.UUID;

public interface ItemFavoriteService {
    ItemFavorite favourite(ItemFavorite favorite);
    void unFavourite(ItemFavorite favorite);

    boolean checkIsFavorite(UUID itemId, UUID userId);

    List<Item> findFavoriteItems(UUID userId);

}
