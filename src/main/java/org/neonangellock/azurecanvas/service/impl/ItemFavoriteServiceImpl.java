package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemFavorite;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.ItemFavoriteService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
@Service
public class ItemFavoriteServiceImpl extends AbstractQueryService implements ItemFavoriteService {
    protected ItemFavoriteServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    public ItemFavorite favourite(ItemFavorite favorite) {
        if (favorite.getId() == null) {
            entityManager.persist(favorite);
            return favorite;
        }
        return entityManager.merge(favorite);
    }

    @Override
    public void unFavourite(ItemFavorite favorite) {
        if (favorite != null) {
            entityManager.remove(favorite);
        }
    }

    @Override
    public boolean checkIsFavorite(UUID itemId, UUID userId) {
        return !this.findById(userId, itemId).isEmpty();
    }

    private List<Item> findById(UUID userId, UUID itemId) {
        Query query = entityManager.createQuery(
                "SELECT f FROM ItemFavorite f where f.liker.id = :userId AND f.item.id = :itemId");

        query.setParameter("userId", userId);
        query.setParameter("itemId", itemId);

        return query.getResultList();
    }

    @Override
    public List<Item> findFavoriteItems(UUID userId) {
        Query query = entityManager.createQuery(
                "SELECT i FROM Item i WHERE EXISTS (SELECT if FROM ItemFavorite if where if.liker.id = :follower AND if.item.id = i.id)");

        query.setParameter("follower", userId);

        return query.getResultList();
    }
}
