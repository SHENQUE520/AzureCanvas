package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.service.impl.storymap.StoryMapServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class StoryMapController {
    @Autowired
    private StoryMapServiceImpl service;

    @GetMapping("/storymaps")
    private ResponseEntity<?> getAllStoryMap(@RequestParam(value = "page",defaultValue = "1") int page, @RequestParam(value = "limit",defaultValue = "1") int limit){
        List<StoryMap> storyMaps = service.findAllWithRange(page, limit);
        if (storyMaps != null){
            List<StoryMap> response = new ArrayList<>(storyMaps);
            return ResponseEntity.ok().body(Map.of("message", "ok", "data", response));
        }

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/storymaps")
    private ResponseEntity<?> deleteStoryMapByID(@RequestParam(value = "id") int id){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 2. 检查用户是否已认证 (通常 Spring Security 会处理大部分情况，但也可以显式检查)
        if (authentication == null ||
                !authentication.isAuthenticated() ||
                Objects.equals(authentication.getPrincipal(), "anonymousUser")) {
            // 如果用户未登录，返回未授权
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","User not authenticated."));
        }
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
