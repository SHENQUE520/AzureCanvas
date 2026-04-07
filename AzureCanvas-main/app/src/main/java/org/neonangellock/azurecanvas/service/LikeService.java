package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Like;
import org.neonangellock.azurecanvas.model.User;

public interface LikeService {
    Like findByUserAndTarget(User user, Integer targetId, Like.TargetType targetType);
    void like(User user, Integer targetId, Like.TargetType targetType);
    void unlike(User user, Integer targetId, Like.TargetType targetType);
    boolean isLiked(User user, Integer targetId, Like.TargetType targetType);
}
