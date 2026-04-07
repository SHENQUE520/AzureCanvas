package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;

public interface UserService {
    User findByUsername(String username);
    User findByEmail(String email);
    User save(User user);
    User register(User user);
    User login(String username, String password);
}
