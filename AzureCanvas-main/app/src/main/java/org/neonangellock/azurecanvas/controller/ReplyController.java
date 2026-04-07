package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Reply;
import org.neonangellock.azurecanvas.service.PostService;
import org.neonangellock.azurecanvas.service.ReplyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/replies")
public class ReplyController {

    @Autowired
    private ReplyService replyService;

    @Autowired
    private PostService postService;

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Reply>> getRepliesByPost(@PathVariable Integer postId) {
        Post post = postService.findById(postId);
        if (post == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(replyService.findByPost(post));
    }

    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<Reply>> getRepliesByParent(@PathVariable Integer parentId) {
        Reply parent = replyService.findById(parentId);
        if (parent == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(replyService.findByParent(parent));
    }

    @PostMapping
    public ResponseEntity<Reply> createReply(@RequestBody Reply reply) {
        return ResponseEntity.ok(replyService.save(reply));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reply> updateReply(@PathVariable Integer id, @RequestBody Reply reply) {
        Reply existingReply = replyService.findById(id);
        if (existingReply == null) {
            return ResponseEntity.notFound().build();
        }
        reply.setId(id);
        return ResponseEntity.ok(replyService.save(reply));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReply(@PathVariable Integer id) {
        replyService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
