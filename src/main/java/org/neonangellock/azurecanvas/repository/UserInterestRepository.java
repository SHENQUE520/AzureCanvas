package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserInterestRepository extends JpaRepository<UserInterest, UUID> {
    void deleteByUser(User user);

    @Query("SELECT ui.interest FROM UserInterest ui WHERE ui.user.userId = :userId ORDER BY ui.interest ASC")
    List<String> findInterestsByUserId(@Param("userId") UUID userId);
}
