package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public User findByUsername(String username) {
        Query query = entityManager.createQuery("SELECT u FROM User u WHERE u.username = :username");
        query.setParameter("username", username);
        try {
            return (User) query.getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public User findByEmail(String email) {
        Query query = entityManager.createQuery("SELECT u FROM User u WHERE u.email = :email");
        query.setParameter("email", email);
        try {
            return (User) query.getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public User save(User user) {
        return entityManager.merge(user);
    }

    @Override
    public User register(User user) {
        // 密码加密
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // 设置默认角色
        user.setRole(User.Role.user);
        // 保存用户
        entityManager.persist(user);
        return user;
    }

    @Override
    public User login(String username, String password) {
        User user = findByUsername(username);
        if (user != null) {
            // 尝试使用加密密码验证
            if (passwordEncoder.matches(password, user.getPassword())) {
                return user;
            }
            // 如果加密密码验证失败，尝试直接比较明文密码
            if (password.equals(user.getPassword())) {
                return user;
            }
        }
        return null;
    }
}
