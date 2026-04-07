package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Post;
import org.neonangellock.azurecanvas.model.Reply;

import java.util.List;

public interface ReplyService {
    Reply findById(Integer id);
    List<Reply> findByPost(Post post);
    List<Reply> findByParent(Reply parent);
    Reply save(Reply reply);
    void deleteById(Integer id);
}
