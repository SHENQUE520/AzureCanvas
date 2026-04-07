package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Section;
import org.neonangellock.azurecanvas.service.SectionService;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

@Service
public class SectionServiceImpl implements SectionService {

    private final EntityManager entityManager;

    public SectionServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Section findById(Integer id) {
        return entityManager.find(Section.class, id);
    }

    @Override
    public List<Section> findAll() {
        Query query = entityManager.createQuery("SELECT s FROM Section s ORDER BY s.orderNum ASC");
        return query.getResultList();
    }

    @Override
    public Section save(Section section) {
        if (section.getId() == null) {
            entityManager.persist(section);
            return section;
        } else {
            return entityManager.merge(section);
        }
    }

    @Override
    public void deleteById(Integer id) {
        Section section = entityManager.find(Section.class, id);
        if (section != null) {
            entityManager.remove(section);
        }
    }
}
