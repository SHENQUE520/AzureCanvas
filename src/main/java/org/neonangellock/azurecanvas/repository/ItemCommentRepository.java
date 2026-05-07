package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.ItemComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemCommentRepository extends JpaRepository<ItemComment, UUID> {
    List<ItemComment> findByItem_ItemIdOrderByCreatedAtDesc(UUID itemId);
    long countByItem_ItemId(UUID itemId);
}
