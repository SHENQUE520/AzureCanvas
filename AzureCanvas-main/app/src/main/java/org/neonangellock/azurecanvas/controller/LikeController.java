package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.Like;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleLike(@RequestBody LikeRequest request, @RequestAttribute("user") User user) {
        try {
            Like.TargetType targetType = Like.TargetType.valueOf(request.getTargetType());
            if (likeService.isLiked(user, request.getTargetId(), targetType)) {
                likeService.unlike(user, request.getTargetId(), targetType);
                return ResponseEntity.ok("取消点赞成功");
            } else {
                likeService.like(user, request.getTargetId(), targetType);
                return ResponseEntity.ok("点赞成功");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("操作失败：" + e.getMessage());
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkLike(@RequestParam Integer targetId, @RequestParam String targetType, @RequestAttribute("user") User user) {
        try {
            Like.TargetType type = Like.TargetType.valueOf(targetType);
            boolean isLiked = likeService.isLiked(user, targetId, type);
            return ResponseEntity.ok(isLiked);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("操作失败：" + e.getMessage());
        }
    }

    // 点赞请求参数
    public static class LikeRequest {
        private Integer targetId;
        private String targetType;

        public Integer getTargetId() {
            return targetId;
        }

        public void setTargetId(Integer targetId) {
            this.targetId = targetId;
        }

        public String getTargetType() {
            return targetType;
        }

        public void setTargetType(String targetType) {
            this.targetType = targetType;
        }
    }
}
