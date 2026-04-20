package org.neonangellock.azurecanvas.service.impl.storymap;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoryMapServiceImpl extends AbstractQueryService implements IStoryMapService {
    protected StoryMapServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    public List<StoryMap> findStoriesByUser(User user) {
        Query query = this.entityManager.createQuery("select s from StoryMap s where s.authorId = :userId");
        try {
            return (List<StoryMap>) query.getResultList();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void updateLocationOfStory(StoryMap storyMap, StoryMapLocation newLocation) {

    }

    @Override
    public void deleteLocationFromStory(StoryMap storyMap, StoryMapLocation removal) {

    }

    @Override
    public void addLocationFromStory(StoryMap storyMap, StoryMapLocation location) {

    }

    @Override
    public StoryMap findById(Integer id) {
        Query query = this.entityManager.createQuery("select s from StoryMap s where s.id = :id");
        query.setParameter("id", id);

        try {
            return (StoryMap) query.getSingleResultOrNull();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public List<StoryMap> findAll() {
        return null;
    }

    public List<StoryMap> findAllWithRange(int page, int limit) {
        int offset = (page - 1) * limit;
        TypedQuery<StoryMap> query = this.entityManager.createQuery("SELECT s FROM StoryMap s ORDER BY s.createdAt DESC", StoryMap.class);
        query.setMaxResults(limit);
        query.setFirstResult(offset);
        return query.getResultList();
    }

    @Override
    public StoryMap save(StoryMap storyMap) {
        if (storyMap.getStoryMapId() == null) {
            entityManager.persist(storyMap);
            return storyMap;
        } else {
            return entityManager.merge(storyMap);
        }
    }

    @Override
    public void deleteById(Integer id) {
        StoryMap storyMap = entityManager.find(StoryMap.class, id);
        if (storyMap != null) {
            entityManager.remove(storyMap);
        }
    }
}
