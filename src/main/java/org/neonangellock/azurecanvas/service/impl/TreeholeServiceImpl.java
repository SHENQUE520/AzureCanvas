package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.RobotConfig;
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.service.TreeholeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TreeholeServiceImpl implements TreeholeService {

    private final EntityManager entityManager;

    public TreeholeServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public TreeholePost findPostById(Integer id) {
        return entityManager.find(TreeholePost.class, id);
    }

    @Override
    public List<TreeholePost> findAllPosts() {
        Query query = entityManager.createQuery("SELECT p FROM TreeholePost p ORDER BY p.createdAt DESC");
        return query.getResultList();
    }

    @Override
    public List<TreeholePost> findRecentPosts(int limit) {
        Query query = entityManager.createQuery("SELECT p FROM TreeholePost p ORDER BY p.createdAt DESC");
        query.setMaxResults(limit);
        return query.getResultList();
    }

    @Override
    @Transactional
    public TreeholePost savePost(TreeholePost post) {
        if (post.getId() == null) {
            entityManager.persist(post);
            return post;
        } else {
            return entityManager.merge(post);
        }
    }

    @Override
    @Transactional
    public void deletePostById(Integer id) {
        TreeholePost post = entityManager.find(TreeholePost.class, id);
        if (post != null) {
            entityManager.remove(post);
        }
    }

    @Override
    @Transactional
    public void incrementLikeCount(Integer postId) {
        TreeholePost post = entityManager.find(TreeholePost.class, postId);
        if (post != null) {
            post.setLikeCount(post.getLikeCount() + 1);
            entityManager.merge(post);
        }
    }

    @Override
    @Transactional
    public void decrementLikeCount(Integer postId) {
        TreeholePost post = entityManager.find(TreeholePost.class, postId);
        if (post != null && post.getLikeCount() > 0) {
            post.setLikeCount(post.getLikeCount() - 1);
            entityManager.merge(post);
        }
    }

    @Override
    public TreeholeComment findCommentById(Integer id) {
        return entityManager.find(TreeholeComment.class, id);
    }

    @Override
    public List<TreeholeComment> findCommentsByPostId(Integer postId) {
        Query query = entityManager.createQuery(
            "SELECT c FROM TreeholeComment c WHERE c.post.id = :postId ORDER BY c.createdAt ASC");
        query.setParameter("postId", postId);
        return query.getResultList();
    }

    @Override
    @Transactional
    public TreeholeComment saveComment(TreeholeComment comment) {
        if (comment.getId() == null) {
            entityManager.persist(comment);
            TreeholePost post = comment.getPost();
            if (post != null) {
                post.setCommentCount(post.getCommentCount() + 1);
                entityManager.merge(post);
            }
            return comment;
        } else {
            return entityManager.merge(comment);
        }
    }

    @Override
    @Transactional
    public void deleteCommentById(Integer id) {
        TreeholeComment comment = entityManager.find(TreeholeComment.class, id);
        if (comment != null) {
            TreeholePost post = comment.getPost();
            if (post != null && post.getCommentCount() > 0) {
                post.setCommentCount(post.getCommentCount() - 1);
                entityManager.merge(post);
            }
            entityManager.remove(comment);
        }
    }

    @Override
    @Transactional
    public TreeholePost createRobotPost(Integer robotId, String content) {
        RobotConfig robot = entityManager.find(RobotConfig.class, robotId);
        if (robot == null) {
            return null;
        }

        TreeholePost post = new TreeholePost();
        post.setContent(content);
        post.setAuthorName(robot.getName());
        post.setAuthorAvatar(robot.getAvatar());
        post.setRobotPost(true);
        post.setRobot(robot);
        
        entityManager.persist(post);
        return post;
    }

    @Override
    @Transactional
    public TreeholeComment createRobotComment(Integer robotId, Integer postId, String content) {
        RobotConfig robot = entityManager.find(RobotConfig.class, robotId);
        TreeholePost post = entityManager.find(TreeholePost.class, postId);
        
        if (robot == null || post == null) {
            return null;
        }

        TreeholeComment comment = new TreeholeComment();
        comment.setContent(content);
        comment.setAuthorName(robot.getName());
        comment.setAuthorAvatar(robot.getAvatar());
        comment.setRobotComment(true);
        comment.setRobot(robot);
        comment.setPost(post);
        
        entityManager.persist(comment);
        
        post.setCommentCount(post.getCommentCount() + 1);
        entityManager.merge(post);
        
        return comment;
    }
}
