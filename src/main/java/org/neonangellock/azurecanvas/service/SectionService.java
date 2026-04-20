package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Section;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.abstracts.IContentService;

import java.util.List;

public interface SectionService extends IContentService<Section> {
    List<Section> findSectionsByUser(User user);
}
