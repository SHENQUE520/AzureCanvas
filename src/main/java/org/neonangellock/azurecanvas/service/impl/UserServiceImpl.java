package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserInterest;
import org.neonangellock.azurecanvas.repository.UserInterestRepository;
import org.neonangellock.azurecanvas.repository.UserRepository;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserInterestRepository interestRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, UserInterestRepository interestRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.interestRepository = interestRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User findById(UUID id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public User findByIdWithInterests(UUID id) {
        return userRepository.findByIdWithInterests(id).orElse(null);
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
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public User register(User user, String password) {
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.Role.user);
        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = findByUsername(username);
        if (user == null) {
            user = findByEmail(username);
        }

        if (user != null) {
            if (passwordEncoder.matches(password, user.getPasswordHash())) {
                return user;
            }
        }
        return null;
    }

    @Override
    @Transactional
    public void updateUserInterests(User user, List<String> interests) {
        interestRepository.deleteByUser(user);
        if (interests != null) {
            List<UserInterest> userInterests = interests.stream()
                    .map(interest -> {
                        UserInterest ui = new UserInterest();
                        ui.setUser(user);
                        ui.setInterest(interest);
                        return ui;
                    })
                    .collect(Collectors.toList());
            interestRepository.saveAll(userInterests);
        }
    }

    @Override
    public List<String> getUserInterests(UUID userId) {
        return interestRepository.findInterestsByUserId(userId);
    }

    @Override
    public boolean existsByUsernameExcludingUser(String username, UUID userId) {
        return userRepository.existsByUsernameAndUserIdNot(username, userId);
    }

    @Override
    public boolean existsByEmailExcludingUser(String email, UUID userId) {
        return userRepository.existsByEmailAndUserIdNot(email, userId);
    }
}