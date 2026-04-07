package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Reply;
import org.neonangellock.azurecanvas.service.ReplyService;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

@Service
public class ReplyServiceImpl implements ReplyService {

    private final EntityManager entityManager;

    public ReplyServiceImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Reply findById(Integer id) {
        return entityManager.find(Reply.class, id);
    }

    @Override
    public List<Reply> findByPost(Post post) {
        Query query = entityManager.createQuery("SELECT r FROM Reply r WHERE r.post = :post AND r.parent IS NULL ORDER BY r.createdAt ASC");
        query.setParameter("post", post);
        return query.getResultList();
    }

    @Override
    public List<Reply> findByParent(Reply parent) {
        Query query = entityManager.createQuery("SELECT r FROM Reply r WHERE r.parent = :parent ORDER BY r.createdAt ASC");
        query.setParameter("parent", parent);
        return query.getResultList();
    }

    @Override
    public Reply save(Reply reply) {
        if (reply.getId() == null) {
            entityManager.persist(reply);
            return reply;
        } else {
            return entityManager.merge(reply);
        }
    }

    @Override
    public void deleteById(Integer id) {
        Reply reply = entityManager.find(Reply.class, id);
        if (reply != null) {
            entityManager.remove(reply);
        }
    }
}
