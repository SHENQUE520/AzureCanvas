package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserFollower;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.IUserFollowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserFollowServiceImpl extends AbstractQueryService implements IUserFollowService {
    protected UserFollowServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    @Transactional
    public UserFollower followUser(UserFollower follower) {
        if (follower.getId() == null) {
            entityManager.persist(follower);
            return follower;
        }
        return entityManager.merge(follower);
    }

    @Override
    public boolean checkIsFollowed(UUID current, UUID another) {
        return !this.findById(current, another).isEmpty();
    }

    @Override
    @Transactional
    public boolean unfollowUser(UserFollower follower) {
        if (follower != null) {
            entityManager.remove(follower);
            return true;
        }
        return false;
    }

    @Override
    public List<User> findFollowerListById(UUID userId) {
        Query query = entityManager.createQuery(
                "SELECT u FROM User u WHERE EXISTS (SELECT f FROM UserFollower f where f.following.id = :following AND f.following.id = u.id)");

        query.setParameter("following", userId);

        return query.getResultList();
    }

    @Override
    public List<User> findFollowingListById(UUID userId) {
        Query query = entityManager.createQuery(
                "SELECT u FROM User u WHERE EXISTS (SELECT f FROM UserFollower f where f.follower.id = :follower AND f.follower.id = u.id)");

        query.setParameter("follower", userId);

        return query.getResultList();
    }

    public List<UserFollower> findById(UUID follower, UUID following){
        Query query = entityManager.createQuery(
                "SELECT f FROM UserFollower f where f.follower.id = :followerId AND f.following.id = :followingId");

        query.setParameter("followerId", follower);
        query.setParameter("followingId", following);

        return query.getResultList();
    }
}
