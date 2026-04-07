package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Section;

import java.util.List;

public interface PostService {
    Post findById(Integer id);
    List<Post> findAll();
    List<Post> findBySection(Section section);
    Post save(Post post);
    void deleteById(Integer id);
    void incrementViewCount(Integer postId);
    void incrementLikeCount(Integer postId);
    void decrementLikeCount(Integer postId);
}
