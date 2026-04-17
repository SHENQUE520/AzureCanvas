package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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
    public ResponseEntity<?> register(@RequestBody Map<String, String> registrationData) {
        String username = registrationData.get("username");
        String email = registrationData.get("email");
        String phone = registrationData.get("phone");
        String password = registrationData.get("password");

        // 检查用户名是否已存在
        if (userService.findByUsername(username) != null) {
            return ResponseEntity.badRequest().body("用户名已存在");
        }
        // 检查邮箱是否已存在
        if (email != null && !email.isEmpty() && userService.findByEmail(email) != null) {
            return ResponseEntity.badRequest().body("邮箱已被注册");
        }
        // 检查手机号是否已存在
        if (phone != null && !phone.isEmpty() && userService.findByPhone(phone) != null) {
            return ResponseEntity.badRequest().body("手机号已被注册");
        }

        // 创建新用户
        User user = new User();
        user.setUsername(username);
        user.setEmail(email != null ? email : username + "@default.com");
        user.setPhone(phone);
        user.setPassword(password);

        // 注册用户
        User registeredUser = userService.register(user);

        // 返回用户信息
        Map<String, Object> response = new HashMap<>();
        response.put("id", registeredUser.getId());
        response.put("username", registeredUser.getUsername());
        response.put("email", registeredUser.getEmail());
        response.put("phone", registeredUser.getPhone());
        response.put("role", registeredUser.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        try {
            // 使用自定义登录方法验证用户（支持用户名、邮箱、手机号登录）
            User user = userService.login(username, password);
            if (user != null) {
                // 生成JWT令牌
                UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
                String token = jwtUtil.generateToken(userDetails);

                // 返回令牌和用户信息
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("user", user);

                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body("用户名、邮箱或手机号不存在，或密码错误");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("登录失败: " + e.getMessage());
        }
    }
}