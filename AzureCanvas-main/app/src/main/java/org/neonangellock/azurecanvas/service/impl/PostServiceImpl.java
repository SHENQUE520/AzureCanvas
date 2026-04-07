package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Section;
import org.neonangellock.azurecanvas.service.PostService;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final EntityManager entityManager;

    public PostServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Post findById(Integer id) {
        return entityManager.find(Post.class, id);
    }

    @Override
    public List<Post> findAll() {
        Query query = entityManager.createQuery("SELECT p FROM Post p ORDER BY p.createdAt DESC");
        return query.getResultList();
    }

    @Override
    public List<Post> findBySection(Section section) {
        Query query = entityManager.createQuery("SELECT p FROM Post p WHERE p.section = :section ORDER BY p.createdAt DESC");
        query.setParameter("section", section);
        return query.getResultList();
    }

    @Override
    public Post save(Post post) {
        if (post.getId() == null) {
            entityManager.persist(post);
            return post;
        } else {
            return entityManager.merge(post);
        }
    }

    @Override
    public void deleteById(Integer id) {
        Post post = entityManager.find(Post.class, id);
        if (post != null) {
            entityManager.remove(post);
        }
    }

    @Override
    public void incrementViewCount(Integer postId) {
        Query query = entityManager.createQuery("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId");
        query.setParameter("postId", postId);
        query.executeUpdate();
    }

    @Override
    public void incrementLikeCount(Integer postId) {
        Query query = entityManager.createQuery("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId");
        query.setParameter("postId", postId);
        query.executeUpdate();
    }

    @Override
    public void decrementLikeCount(Integer postId) {
        Query query = entityManager.createQuery("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId AND p.likeCount > 0");
        query.setParameter("postId", postId);
        query.executeUpdate();
    }
}
