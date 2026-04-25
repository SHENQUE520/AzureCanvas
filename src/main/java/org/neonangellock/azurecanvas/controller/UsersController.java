package org.neonangellock.azurecanvas.controller;

import jakarta.servlet.http.Cookie;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserFollower;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.service.impl.UserFollowServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:8000", "http://127.0.0.1:5500"}, allowCredentials = "true")
public class UsersController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserFollowServiceImpl followerService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "user_id", required = false) UUID userId) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userService.findById(userId);
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "USER_NOT_FOUND");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @CookieValue(name = "user_id", required = false) UUID userId,
            @RequestBody Map<String, String> updates) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userService.findById(userId);
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "USER_NOT_FOUND");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (updates.containsKey("email")) {
            user.setEmail(updates.get("email"));
        }
        if (updates.containsKey("avatar")) {
            user.setAvatarUrl(updates.get("avatar"));
        }
        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio"));
        }

        userService.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getUserId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("avatar", user.getAvatarUrl());
        response.put("role", user.getRole().name());
        response.put("isRobot", user.isRobot());
        response.put("createdAt", user.getJoinedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("{uuid}")
    public ResponseEntity<?> getUserProfileById(@PathVariable UUID uuid){
        User user = userService.findById(uuid);

        if (user != null){
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/posts")
    public ResponseEntity<?> getCurrentUserPosts(
            @CookieValue(name = "user_id", required = false) UUID userId,
            @RequestParam(name = "type", required = false, defaultValue = "forum") String type,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit) {
        if (userId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
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

    @GetMapping("/{userId}/following")
    public ResponseEntity<?> getFollowing(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @PathVariable UUID userId) {

        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        if (userId == null){
            return ResponseEntity.notFound().build();
        }
        List<User> followers;

        try {
            followers = followerService.findFollowingListById(userId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("success", false ,"message", e.getMessage()));
        }

        return ResponseEntity.ok(followers);
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getFollowers(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @PathVariable UUID userId) {

        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        if (userId == null){
            return ResponseEntity.notFound().build();
        }

        List<User> followers;

        try {
            followers = followerService.findFollowerListById(userId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("success", false ,"message", e.getMessage()));
        }

        return ResponseEntity.ok(followers);

    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @PathVariable UUID userId) {
        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        if (currentUserId.equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "不能关注自己"));
        }

        User userToFollow = userService.findById(userId);
        if (userToFollow == null) {
            return ResponseEntity.notFound().build();
        }

        UserFollower follower = new UserFollower();
        follower.setFollowedAt(OffsetDateTime.now());
        follower.setFollower(userService.findById(currentUserId));
        follower.setFollowing(userService.findById(userId));

        followerService.followUser(follower);

        return ResponseEntity.ok(Map.of("success", true,"message", "成功关注用户"));
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<?> unfollowUser(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @PathVariable UUID userId) {
        if (currentUserId == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "NOT_LOGGED_IN");
            response.put("redirect", "../login/index.html?redirect=/user/user.html");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        if (followerService.checkIsFollowed(currentUserId, userId)){
            return ResponseEntity.badRequest().body(Map.of("success", false ,"message", "Unable to unfollow the user."));
        }
        try {
            followerService.unfollowUser(followerService.findById(currentUserId, userId).get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("success", false ,"message", e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("success", true ,"message", "成功取消关注用户"));
    }
}