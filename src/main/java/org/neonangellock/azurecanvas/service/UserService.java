package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;

public interface UserService {
    User findById(Integer id);
    User findByUsername(String username);
    User findByEmail(String email);
    User findByPhone(String phone);
    User save(User user);
    User register(User user);
    User login(String username, String password);
}