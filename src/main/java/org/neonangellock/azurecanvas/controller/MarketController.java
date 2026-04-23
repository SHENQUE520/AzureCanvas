package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.dto.ItemDTO;
import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemCategory;
import org.neonangellock.azurecanvas.model.ItemImage;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.IMarketService;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
<<<<<<< HEAD
import org.neonangellock.azurecanvas.model.es.EsItem;
import org.neonangellock.azurecanvas.service.EsItemService;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    @Autowired
    private IMarketService marketService;

    @Autowired
    private UserService userService;

<<<<<<< HEAD
    @Autowired
    private EsItemService esItemService;

=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }

<<<<<<< HEAD
    @GetMapping("/search/es")
    public ResponseEntity<List<Map<String, Object>>> searchItemsEs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        SearchHits<EsItem> searchHits = esItemService.searchItems(keyword, page - 1, limit);
        
        List<Map<String, Object>> results = searchHits.getSearchHits().stream().map(hit -> {
            EsItem item = hit.getContent();
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getId());
            map.put("title", item.getTitle());
            map.put("description", item.getDescription());
            map.put("price", item.getPrice());
            map.put("category", item.getCategory());
            map.put("status", item.getStatus());
            map.put("location", item.getLocation());
            map.put("views", item.getViews());
            map.put("quality", item.getQuality());
            map.put("createdAt", item.getCreatedAt());
            
            // Get highlights
            Map<String, List<String>> highlights = hit.getHighlightFields();
            if (highlights.containsKey("title")) {
                map.put("highlightTitle", highlights.get("title").get(0));
            }
            if (highlights.containsKey("description")) {
                map.put("highlightDescription", highlights.get("description").get(0));
            }
            
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(results);
    }

=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
    @GetMapping("/items")
    public ResponseEntity<List<ItemDTO>> getAllItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search) {
        
        Page<Item> items = marketService.findAllItems(category, sortBy, order, page, limit, search);
        return ResponseEntity.ok(items.getContent().stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<ItemDTO> getItemDetail(@PathVariable UUID itemId) {
        Item item = marketService.findItemById(itemId);
        if (item == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(item));
    }

    @GetMapping("/users/me/items")
    public ResponseEntity<List<ItemDTO>> getMyItems(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = getCurrentUser();
        Page<Item> items = marketService.findItemsBySeller(currentUser, status, page, limit);
        return ResponseEntity.ok(items.getContent().stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @PostMapping("/items")
    public ResponseEntity<?> createItem(@RequestBody Map<String, Object> request) {
        User user = getCurrentUser();
        Item item;
        if (user != null) {
            item = new Item();
            item.setTitle((String) request.get("title"));
            item.setDescription((String) request.get("description"));
            item.setPrice(new BigDecimal(request.get("price").toString()));
            item.setCategory((String) request.get("category"));
            item.setSeller(user);
        }else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "not logged in", "redirect", "/login/index.html?redirect=/azure_trade/trade.html"));
        }

        Item savedItem = marketService.saveItem(item);
        return ResponseEntity.ok(convertToDTO(savedItem));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable UUID itemId) {
        marketService.deleteItem(itemId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Item deleted successfully."));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<ItemCategory> categories = marketService.findAllCategories();
        return ResponseEntity.ok(categories.stream()
            .map(c -> Map.of("categoryId", c.getCategoryId().toString(), "name", c.getName()))
            .collect(Collectors.toList()));
    }

    @PostMapping("/{sellerId}/contact")
    public ResponseEntity<Map<String, Object>> contactSeller(
            @PathVariable UUID sellerId,
            @RequestBody Map<String, Object> request) {
        // Implementation for contact logic
        return ResponseEntity.ok(Map.of(
            "messageId", UUID.randomUUID().toString(),
            "sentAt", java.time.OffsetDateTime.now().toString()
        ));
    }

    private ItemDTO convertToDTO(Item item) {
        return ItemDTO.builder()
                .itemId(item.getItemId())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .sellerId(item.getSeller().getUserId())
                .sellerUsername(item.getSeller().getUsername())
                .sellerAvatarUrl(item.getSeller().getAvatarUrl())
                .createdAt(item.getCreatedAt())
                .status(item.getStatus())
                .category(item.getCategory())
                .views(item.getViews())
                .location(item.getLocation())
                .images(Collections.emptyList()) // images are in a separate table
                .build();
    }
}