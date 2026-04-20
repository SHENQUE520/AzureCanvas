package org.neonangellock.azurecanvas.service.abstracts;

import org.neonangellock.azurecanvas.model.Section;

import java.util.List;

public interface IContentService <T> {
    T findById(Integer id);
    List<T> findAll();
    T save(T section);
    void deleteById(Integer id);
}
