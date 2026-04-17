package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;

import java.util.List;

public interface TreeholeService {
    TreeholePost findPostById(Integer id);
    List<TreeholePost> findAllPosts();
    List<TreeholePost> findRecentPosts(int limit);
    TreeholePost savePost(TreeholePost post);
    void deletePostById(Integer id);
    void incrementLikeCount(Integer postId);
    void decrementLikeCount(Integer postId);
    
    TreeholeComment findCommentById(Integer id);
    List<TreeholeComment> findCommentsByPostId(Integer postId);
    TreeholeComment saveComment(TreeholeComment comment);
    void deleteCommentById(Integer id);
    
    TreeholePost createRobotPost(Integer robotId, String content);
    TreeholeComment createRobotComment(Integer robotId, Integer postId, String content);
}
