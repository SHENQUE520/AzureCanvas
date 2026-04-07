package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Like;
import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.service.LikeService;
import org.neonangellock.azurecanvas.service.PostService;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.User;

@Service
public class LikeServiceImpl implements LikeService {

    private final EntityManager entityManager;
    private final PostService postService;

    public LikeServiceImpl(EntityManager entityManager, PostService postService) {
        this.entityManager = entityManager;
        this.postService = postService;
    }

    @Override
    public Like findByUserAndTarget(User user, Integer targetId, Like.TargetType targetType) {
        Query query = entityManager.createQuery("SELECT l FROM Like l WHERE l.user = :user AND l.targetId = :targetId AND l.targetType = :targetType");
        query.setParameter("user", user);
        query.setParameter("targetId", targetId);
        query.setParameter("targetType", targetType);
        try {
            return (Like) query.getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void like(User user, Integer targetId, Like.TargetType targetType) {
        // 检查是否已经点赞
        if (findByUserAndTarget(user, targetId, targetType) != null) {
            return;
        }

        // 创建点赞记录
        Like like = new Like();
        like.setUser(user);
        like.setTargetId(targetId);
        like.setTargetType(targetType);
        entityManager.persist(like);

        // 更新帖子的点赞数
        if (targetType == Like.TargetType.post) {
            postService.incrementLikeCount(targetId);
        }
    }

    @Override
    public void unlike(User user, Integer targetId, Like.TargetType targetType) {
        // 查找点赞记录
        Like like = findByUserAndTarget(user, targetId, targetType);
        if (like != null) {
            // 删除点赞记录
            entityManager.remove(like);

            // 更新帖子的点赞数
            if (targetType == Like.TargetType.post) {
                postService.decrementLikeCount(targetId);
            }
        }
    }

    @Override
    public boolean isLiked(User user, Integer targetId, Like.TargetType targetType) {
        return findByUserAndTarget(user, targetId, targetType) != null;
    }
}
