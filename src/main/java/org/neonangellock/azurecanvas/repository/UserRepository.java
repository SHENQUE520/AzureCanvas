package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByUsername(String username);

    User findByEmail(String email);

    User findByPhone(String phone);
}