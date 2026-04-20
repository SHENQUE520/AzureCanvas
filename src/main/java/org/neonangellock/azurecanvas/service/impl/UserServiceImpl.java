package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.repository.UserRepository;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User findById(Integer id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public User register(User user) {
        // 密码加密
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // 设置默认角色
        user.setRole(User.Role.user);
        // 保存用户
        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        // 先尝试通过用户名查找
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

        // 尝试通过邮箱查找
        user = findByEmail(username);
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

        // 尝试通过手机号查找
        user = findByPhone(username);
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