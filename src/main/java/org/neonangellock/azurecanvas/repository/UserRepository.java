package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findByUsername(String username);

    User findByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.interests WHERE u.userId = :userId")
    Optional<User> findByIdWithInterests(@Param("userId") UUID userId);

    boolean existsByUsernameAndUserIdNot(String username, UUID userId);

    boolean existsByEmailAndUserIdNot(String email, UUID userId);
}