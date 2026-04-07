package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Section;

import java.util.List;

public interface SectionService {
    Section findById(Integer id);
    List<Section> findAll();
    Section save(Section section);
    void deleteById(Integer id);
}
