package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        // 检查用户名是否已存在
        if (userService.findByUsername(user.getUsername()) != null) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        // 检查邮箱是否已存在
        if (userService.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        // 注册用户
        User registeredUser = userService.register(user);
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        try {
            // 使用自定义登录方法验证用户
            User user = userService.login(username, password);
            if (user != null) {
                // 生成JWT令牌
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                String token = jwtUtil.generateToken(userDetails);

                // 返回令牌和用户信息
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("user", user);

                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body("Invalid username or password");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }
}
