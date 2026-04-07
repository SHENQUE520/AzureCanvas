package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Section;
import org.neonangellock.azurecanvas.service.PostService;
import org.neonangellock.azurecanvas.service.SectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.findAll());
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<Post>> getPostsBySection(@PathVariable Integer sectionId) {
        Section section = sectionService.findById(sectionId);
        if (section == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(postService.findBySection(section));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Integer id) {
        Post post = postService.findById(id);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        // 增加浏览量
        postService.incrementViewCount(id);
        return ResponseEntity.ok(post);
    }

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return ResponseEntity.ok(postService.save(post));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Integer id, @RequestBody Post post) {
        Post existingPost = postService.findById(id);
        if (existingPost == null) {
            return ResponseEntity.notFound().build();
        }
        post.setId(id);
        return ResponseEntity.ok(postService.save(post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id) {
        postService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
