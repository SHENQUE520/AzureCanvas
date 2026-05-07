package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.ItemReview;
import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemReviewRepository extends JpaRepository<ItemReview, UUID> {
    List<ItemReview> findByTargetUserOrderByCreatedAtDesc(User targetUser);
    List<ItemReview> findByTargetUserAndRatingOrderByCreatedAtDesc(User targetUser, String rating);
    List<ItemReview> findByTargetUserAndRoleOrderByCreatedAtDesc(User targetUser, String role);
    long countByTargetUser(User targetUser);
    long countByTargetUserAndRating(User targetUser, String rating);
    long countByTargetUserAndRole(User targetUser, String role);
}
