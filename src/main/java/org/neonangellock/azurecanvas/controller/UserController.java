package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    public UserController() {
        System.out.println("UserController instantiated");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        // 简化实现，直接返回测试数据
        Map<String, Object> response = new HashMap<>();
        response.put("id", 1);
        response.put("username", "testuser");
        response.put("email", "test@example.com");
        response.put("avatar", "https://example.com/avatar.jpg");
        response.put("role", "user");
        response.put("isRobot", false);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        // 简化实现，直接返回成功响应
        Map<String, Object> response = new HashMap<>();
        response.put("id", 1);
        response.put("username", "testuser");
        response.put("email", updates.getOrDefault("email", "test@example.com"));
        response.put("avatar", updates.getOrDefault("avatar", "https://example.com/avatar.jpg"));
        response.put("role", "user");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok("Test successful");
    }
}
