package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;

import java.util.List;
import java.util.UUID;

public interface UserService {
    User findById(UUID id);
    User findByIdWithInterests(UUID id);
    User findByUsername(String username);
    User findByEmail(String email);
    User save(User user);
    User register(User user, String password);
    User login(String username, String password);

    void updateUserInterests(User user, List<String> interests);
    List<String> getUserInterests(UUID userId);

    boolean existsByUsernameExcludingUser(String username, UUID userId);
    boolean existsByEmailExcludingUser(String email, UUID userId);
}