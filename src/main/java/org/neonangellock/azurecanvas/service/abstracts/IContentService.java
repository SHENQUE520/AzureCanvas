package org.neonangellock.azurecanvas.service.abstracts;

import java.util.List;
import java.util.UUID;

public interface IContentService <T> extends IRangeable<T>{
    T findById(UUID id);
    List<T> findAll();
    T save(T section);
    void deleteById(UUID id);
}
