package org.neonangellock.azurecanvas.service;

import jakarta.persistence.EntityManager;
import org.neonangellock.azurecanvas.service.abstracts.IContentService;

public abstract class AbstractQueryService {
    protected final EntityManager entityManager;

    protected AbstractQueryService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }
}
