package org.neonangellock.azurecanvas.controller;

import jakarta.servlet.http.Cookie;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:8000", "http://127.0.0.1:5500"}, allowCredentials = "true")
public class UsersController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "user_id", required = false) Integer userId) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userService.findById(userId);
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "USER_NOT_FOUND");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("avatar", user.getAvatar());
        userData.put("role", user.getRole().name());
        userData.put("isRobot", user.isRobot());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("postsCount", 0);
        userData.put("followersCount", 0);
        userData.put("followingCount", 0);

        return ResponseEntity.ok(userData);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @CookieValue(name = "user_id", required = false) Integer userId,
            @RequestBody Map<String, String> updates) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userService.findById(userId);
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "USER_NOT_FOUND");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (updates.containsKey("email")) {
            user.setEmail(updates.get("email"));
        }
        if (updates.containsKey("phone")) {
            user.setPhone(updates.get("phone"));
        }
        if (updates.containsKey("avatar")) {
            user.setAvatar(updates.get("avatar"));
        }
        if (updates.containsKey("bio")) {
        }

        userService.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("avatar", user.getAvatar());
        response.put("role", user.getRole().name());
        response.put("isRobot", user.isRobot());
        response.put("createdAt", user.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/posts")
    public ResponseEntity<?> getCurrentUserPosts(
            @CookieValue(name = "user_id", required = false) Integer userId,
            @RequestParam(name = "type", required = false, defaultValue = "forum") String type,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        List<Map<String, Object>> posts = new ArrayList<>();

        Map<String, Object> post1 = new HashMap<>();
        post1.put("postId", UUID.randomUUID().toString());
        post1.put("title", "我的第一个帖子");
        post1.put("createdAt", new Date());
        post1.put("type", type);
        posts.add(post1);

        Map<String, Object> post2 = new HashMap<>();
        post2.put("postId", UUID.randomUUID().toString());
        post2.put("title", "分享一些有趣的内容");
        post2.put("createdAt", new Date());
        post2.put("type", type);
        posts.add(post2);

        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(
            @CookieValue(name = "user_id", required = false) Integer currentUserId,
            @PathVariable Integer userId) {
        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (currentUserId.equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "不能关注自己"));
        }

        User userToFollow = userService.findById(userId);
        if (userToFollow == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("message", "成功关注用户"));
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<?> unfollowUser(
            @CookieValue(name = "user_id", required = false) Integer currentUserId,
            @PathVariable Integer userId) {
        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../auth/authlogin.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        return ResponseEntity.ok(Map.of("message", "成功取消关注用户"));
    }
}