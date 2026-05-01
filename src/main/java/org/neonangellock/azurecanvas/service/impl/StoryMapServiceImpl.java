package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.repository.StoryMapRepository;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StoryMapServiceImpl extends AbstractQueryService implements IStoryMapService {
    
    @Autowired
    private StoryMapRepository repository;

    protected StoryMapServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    public List<StoryMap> findStoriesByUser(User user) {
        return repository.findByAuthorId(user.getUserId(), PageRequest.of(0, 100)).getContent();
    }

    @Override
    @Transactional
    public void updateLocationOfStory(StoryMap storyMap, StoryMapLocation newLocation) {
        // Implementation for updating locations
    }

    public List<StoryMap> findNewest(){
        Query query = entityManager.createQuery(
                "SELECT p FROM StoryMap p WHERE p.createdAt = :lastTimeLogout ORDER BY p.createdAt ASC");

        query.setParameter("lastTimeLogout", OffsetDateTime.now());

        return query.getResultList();
    }

    @Override
    @Transactional
    public void deleteLocationFromStory(StoryMap storyMap, StoryMapLocation removal) {
        storyMap.getLocations().remove(removal);
        repository.save(storyMap);
    }

    @Override
    @Transactional
    public void addLocationFromStory(StoryMap storyMap, StoryMapLocation location) {
        location.setStoryMap(storyMap);
        storyMap.getLocations().add(location);
        repository.save(storyMap);
    }

    @Override
    public StoryMap findById(UUID id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public List<StoryMap> findAll() {
        return repository.findAll();
    }
    @Override
    public List<StoryMap> findAllWithRange(int page, int limit) {
        return repository.findAll(PageRequest.of(page - 1, limit, Sort.by("createdAt").descending())).getContent();
    }
    
    public List<StoryMap> findByAuthor(UUID authorId, int page, int limit) {
        return repository.findByAuthorId(authorId, PageRequest.of(page - 1, limit, Sort.by("createdAt").descending())).getContent();
    }

    @Override
    @Transactional
    public StoryMap save(StoryMap storyMap) {
        return repository.save(storyMap);
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    // 搜索故事地图
    @Override
    public List<StoryMap> searchByKeyword(String keyword) {
        return repository.searchByKeyword(keyword);
    }
}