package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.dto.StoryMapDTO;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.es.EsStoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.responses.StorymapResponse;
import org.neonangellock.azurecanvas.service.EsStoryMapService;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.service.impl.StoryMapServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/storymaps")
public class StoryMapController {

    @Autowired
    private StoryMapServiceImpl service;

    @Autowired
    private UserService userService;
    @Autowired
    private EsStoryMapService esStoryMapService;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }

    /**
     * 搜索故事地图
     *
     * @param keyword 搜索关键词
     * @return 搜索结果
     */
    @GetMapping(value = "/search", produces = "application/json; charset=utf-8")
    public ResponseEntity<List<StorymapResponse>> searchStorymaps(
            @RequestParam String keyword) {

        // 调用ES服务进行搜索
        SearchHits<EsStoryMap> searchHits = esStoryMapService.searchStoryMap(keyword, 0, 100);

        // 转换为前端需要的格式
        List<StorymapResponse> responseList = new ArrayList<>();

        // 检查searchHits是否为null，以及是否有搜索结果
        if (searchHits != null && searchHits.hasSearchHits()) {
            responseList = searchHits.getSearchHits().stream()
                    .map(searchHit -> {
                        EsStoryMap storyMap = searchHit.getContent();
                        StorymapResponse response = new StorymapResponse();
                        response.setStoryMapId(storyMap.getStoryMapId());
                        response.setTitle(storyMap.getTitle());
                        response.setDescription(storyMap.getDescription());
                        response.setCategory(storyMap.getCategory());
                        response.setLocation(storyMap.getLocation());
                        response.setLat(storyMap.getLat());
                        response.setLng(storyMap.getLng());
                        response.setLikes(storyMap.getLikes());
                        response.setComments(storyMap.getComments());
                        response.setAuthorID(storyMap.getAuthorID());
                        response.setAuthor(storyMap.getAuthor());
                        response.setCreatedAt(storyMap.getCreatedAt());
                        response.setUpdatedAt(storyMap.getUpdatedAt());

                        // 处理高亮信息
                        if (searchHit.getHighlightFields() != null && !searchHit.getHighlightFields().isEmpty()) {
                            // 处理标题高亮
                            if (searchHit.getHighlightFields().containsKey("title")) {
                                List<String> highlightTitle = searchHit.getHighlightFields().get("title");
                                if (highlightTitle != null && !highlightTitle.isEmpty()) {
                                    response.setTitle(String.join(" ", highlightTitle));
                                }
                            }
                            // 处理描述高亮
                            if (searchHit.getHighlightFields().containsKey("description")) {
                                List<String> highlightDescription = searchHit.getHighlightFields().get("description");
                                if (highlightDescription != null && !highlightDescription.isEmpty()) {
                                    response.setDescription(String.join(" ", highlightDescription));
                                }
                            }
                            // 处理地点高亮
                            if (searchHit.getHighlightFields().containsKey("location")) {
                                List<String> highlightLocation = searchHit.getHighlightFields().get("location");
                                if (highlightLocation != null && !highlightLocation.isEmpty()) {
                                    response.setLocation(String.join(" ", highlightLocation));
                                }
                            }
                        }

                        return response;
                    })
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(responseList);
    }

    @GetMapping(produces = "application/json; charset=utf-8")
    public ResponseEntity<List<StoryMapDTO>> getAllStoryMaps(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        List<StoryMap> storyMaps = service.findAllWithRange(page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }
    @GetMapping("/update")
    public ResponseEntity<String> updateStorymaps() {
        try {
            // 调用ES服务同步数据
            esStoryMapService.syncStoryMapFromDb();
            return ResponseEntity.ok("数据更新成功");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("数据更新失败: " + e.getMessage());
        }
    }

    @GetMapping("/users/me/storymaps")
    public ResponseEntity<List<StoryMapDTO>> getMyStoryMaps(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = getCurrentUser();
        List<StoryMap> storyMaps = service.findByAuthor(currentUser.getUserId(), page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/{storyMapId}")
    public ResponseEntity<StoryMapDTO> getStoryMapDetail(@PathVariable UUID storyMapId) {
        StoryMap storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(storyMap));
    }

    @PostMapping
    public ResponseEntity<?> createStoryMap(@RequestBody Map<String, Object> request) {
        User user = getCurrentUser();

        if (user != null) {
            StoryMap storyMap = new StoryMap();
            storyMap.setTitle((String) request.get("title"));
            storyMap.setContent((String) request.get("description"));
            storyMap.setCoverImageUrl((String) request.get("coverImageUrl"));
            storyMap.setAuthorId(user.getUserId());
            storyMap.setCreatedAt(OffsetDateTime.now());
            storyMap.setUpdatedAt(OffsetDateTime.now());

            StoryMapLocation location = new StoryMapLocation();
            location.setStoryMap(storyMap);
            location.setLng(new BigDecimal(String.valueOf(request.get("lng"))));
            location.setLat(new BigDecimal(String.valueOf(request.get("lat"))));
            location.setCreatedAt(OffsetDateTime.now());
            location.setUpdatedAt(OffsetDateTime.now());
            location.setTitle((String) request.get("title"));
            location.setDescription((String) request.get("description"));
            storyMap.setLocations(List.of(location));

            StoryMap saved = service.save(storyMap);

            System.out.println(";map" + storyMap);
            System.out.println("location" + location);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(saved));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN", "redirect", "/login/index.html?redirect=/storymap/index.html"));
        }
    }

    @PutMapping("/storymaps/{storyMapId}")
    public ResponseEntity<StoryMapDTO> updateStoryMap(
            @PathVariable UUID storyMapId,
            @RequestBody Map<String, Object> request) {
        
        StoryMap storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        
        if (request.containsKey("title")) storyMap.setTitle((String) request.get("title"));
        if (request.containsKey("description")) storyMap.setContent((String) request.get("description"));
        
        StoryMap updated = service.save(storyMap);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @DeleteMapping("/storymaps/{storyMapId}")
    public ResponseEntity<Map<String, Object>> deleteStoryMap(@PathVariable UUID storyMapId) {
        service.deleteById(storyMapId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Story map deleted successfully."));
    }

    private StoryMapDTO convertToDTO(StoryMap storyMap) {
        User author = userService.findById(storyMap.getAuthorId());
        String authorName = author != null ? author.getUsername() : "Unknown";

        List<StoryMapDTO.LocationDTO> locations = Collections.emptyList();
        if (storyMap.getLocations() != null) {
            locations = storyMap.getLocations().stream()
                    .map(loc -> StoryMapDTO.LocationDTO.builder()
                            .locationId(loc.getLocationId())
                            .lat(loc.getLat())
                            .lng(loc.getLng())
                            .title(loc.getTitle())
                            .description(loc.getDescription())
                            .imageUrl(loc.getImageUrl())
                            .build())
                    .collect(Collectors.toList());
        }

        return StoryMapDTO.builder()
                .storyMapId(storyMap.getStoryMapId())
                .title(storyMap.getTitle())
                .description(storyMap.getContent())
                .authorId(storyMap.getAuthorId())
                .author(authorName)
                .createdAt(storyMap.getCreatedAt())
                .updatedAt(storyMap.getUpdatedAt())
                .coverImageUrl(storyMap.getCoverImageUrl())
                .locations(locations)
                .likes(storyMap.getStats() != null ? storyMap.getStats().getLikesCount() : 0)
                .comments(storyMap.getStats() != null ? String.valueOf(storyMap.getStats().getCommentCount()) : "0")
                .build();
    }
}