package org.neonangellock.azurecanvas.controller;

<<<<<<< HEAD
import org.neonangellock.azurecanvas.service.EsTreeHoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/treehole")
public class TreeHoleController {

    @Autowired
    private EsTreeHoleService esTreeHoleService;

    @GetMapping("/search/es")
    public List<Map<String, Object>> searchTreeHoleEs(
            @RequestParam("keyword") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var searchHits = esTreeHoleService.searchTreeHole(keyword, page, size);
        List<Map<String, Object>> result = new ArrayList<>();

        for (var hit : searchHits.getSearchHits()) {
            var content = hit.getContent();
            Map<String, Object> item = Map.of(
                    "id", content.getId(),
                    "boardName", content.getBoardName(),
                    "title", content.getTitle(),
                    "content", content.getContent(),
                    "highlightTitle", hit.getHighlightFields().get("title"),
                    "highlightContent", hit.getHighlightFields().get("content")
            );
            result.add(item);
        }

        return result;
    }

    @PostMapping("/sync")
    public void syncTreeHole() {
        esTreeHoleService.syncTreeHoleFromApi();
=======
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.service.TreeholeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/treehole")
public class TreeholeController {

    @Autowired
    private TreeholeService treeholeService;

    @GetMapping("/posts")
    public ResponseEntity<List<TreeholePost>> getAllPosts() {
        return ResponseEntity.ok(treeholeService.findAllPosts());
    }

    @GetMapping("/posts/recent")
    public ResponseEntity<List<TreeholePost>> getRecentPosts(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(treeholeService.findRecentPosts(limit));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<TreeholePost> getPostById(@PathVariable Integer id) {
        TreeholePost post = treeholeService.findPostById(id);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(post);
    }

    @PostMapping("/posts")
    public ResponseEntity<TreeholePost> createPost(@RequestBody TreeholePost post) {
        return ResponseEntity.ok(treeholeService.savePost(post));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id) {
        treeholeService.deletePostById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Integer id) {
        treeholeService.incrementLikeCount(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{id}/unlike")
    public ResponseEntity<Void> unlikePost(@PathVariable Integer id) {
        treeholeService.decrementLikeCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<TreeholeComment>> getCommentsByPostId(@PathVariable Integer postId) {
        return ResponseEntity.ok(treeholeService.findCommentsByPostId(postId));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<TreeholeComment> createComment(
            @PathVariable Integer postId,
            @RequestBody TreeholeComment comment) {
        TreeholePost post = treeholeService.findPostById(postId);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        comment.setPost(post);
        return ResponseEntity.ok(treeholeService.saveComment(comment));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Integer id) {
        treeholeService.deleteCommentById(id);
        return ResponseEntity.ok().build();
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
    }
}
