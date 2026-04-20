package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.service.abstracts.IContentService;

import java.util.List;

public interface IStoryMapService extends IContentService<StoryMap> {
    List<StoryMap> findStoriesByUser(User user);
    void updateLocationOfStory(StoryMap storyMap, StoryMapLocation newLocation);
    void deleteLocationFromStory(StoryMap storyMap, StoryMapLocation removal);
    void addLocationFromStory(StoryMap storyMap, StoryMapLocation location);
}
