package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserFollower;

import java.util.List;
import java.util.UUID;

public interface IUserFollowService {
    UserFollower followUser(UserFollower follower);
    boolean checkIsFollowed(UUID current, UUID another);
    boolean unfollowUser(UserFollower follower);
    List<User> findFollowerListById(UUID userId);
    List<User> findFollowingListById(UUID userId);

}
