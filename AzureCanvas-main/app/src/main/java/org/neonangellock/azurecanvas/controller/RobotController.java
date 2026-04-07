package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.RobotConfig;
import org.neonangellock.azurecanvas.service.RobotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
public class RobotController {

    @Autowired
    private RobotService robotService;

    @GetMapping
    public ResponseEntity<List<RobotConfig>> getAllRobots() {
        return ResponseEntity.ok(robotService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RobotConfig> getRobotById(@PathVariable Integer id) {
        RobotConfig robotConfig = robotService.findById(id);
        if (robotConfig == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(robotConfig);
    }

    @PostMapping
    public ResponseEntity<RobotConfig> createRobot(@RequestBody RobotConfig robotConfig) {
        return ResponseEntity.ok(robotService.save(robotConfig));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RobotConfig> updateRobot(@PathVariable Integer id, @RequestBody RobotConfig robotConfig) {
        RobotConfig existingRobot = robotService.findById(id);
        if (existingRobot == null) {
            return ResponseEntity.notFound().build();
        }
        robotConfig.setId(id);
        return ResponseEntity.ok(robotService.save(robotConfig));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRobot(@PathVariable Integer id) {
        robotService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleRobotStatus(@PathVariable Integer id) {
        robotService.toggleStatus(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/generate-post")
    public ResponseEntity<Void> generatePost(@PathVariable Integer id) {
        robotService.generatePost(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/generate-reply")
    public ResponseEntity<Void> generateReply(@PathVariable Integer id) {
        robotService.generateReply(id);
        return ResponseEntity.ok().build();
    }
}
