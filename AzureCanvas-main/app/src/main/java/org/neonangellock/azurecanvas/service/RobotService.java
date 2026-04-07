package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.RobotConfig;

import java.util.List;

public interface RobotService {
    RobotConfig findById(Integer id);
    List<RobotConfig> findAll();
    RobotConfig save(RobotConfig robotConfig);
    void deleteById(Integer id);
    void toggleStatus(Integer id);
    void generatePost(Integer robotId);
    void generateReply(Integer robotId);
}
