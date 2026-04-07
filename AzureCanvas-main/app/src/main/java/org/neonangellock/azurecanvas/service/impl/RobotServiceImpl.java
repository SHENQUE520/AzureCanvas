package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.RobotConfig;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.RobotService;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.util.ContentGenerator;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

@Service
public class RobotServiceImpl implements RobotService {

    private final EntityManager entityManager;
    private final UserService userService;

    public RobotServiceImpl(EntityManager entityManager, UserService userService) {
        this.entityManager = entityManager;
        this.userService = userService;
    }

    @Override
    public RobotConfig findById(Integer id) {
        return entityManager.find(RobotConfig.class, id);
    }

    @Override
    public List<RobotConfig> findAll() {
        Query query = entityManager.createQuery("SELECT r FROM RobotConfig r");
        return query.getResultList();
    }

    @Override
    public RobotConfig save(RobotConfig robotConfig) {
        if (robotConfig.getId() == null) {
            // 创建新的机器人用户
            User user = new User();
            user.setUsername("robot_" + System.currentTimeMillis());
            user.setPassword("robot_password"); // 实际应用中应该加密
            user.setEmail("robot_" + System.currentTimeMillis() + "@example.com");
            user.setRole(User.Role.user);
            user.setIsRobot(true);
            user = userService.save(user);
            robotConfig.setUser(user);
            entityManager.persist(robotConfig);
        } else {
            robotConfig = entityManager.merge(robotConfig);
        }
        return robotConfig;
    }

    @Override
    public void deleteById(Integer id) {
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, id);
        if (robotConfig != null) {
            // 删除关联的用户
            User user = robotConfig.getUser();
            if (user != null) {
                entityManager.remove(user);
            }
            entityManager.remove(robotConfig);
        }
    }

    @Override
    public void toggleStatus(Integer id) {
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, id);
        if (robotConfig != null) {
            robotConfig.setEnabled(!robotConfig.isEnabled());
            entityManager.merge(robotConfig);
        }
    }

    @Override
    public void generatePost(Integer robotId) {
        // 实现机器人发帖逻辑
        // 1. 获取机器人配置
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, robotId);
        if (robotConfig == null) {
            return;
        }

        // 2. 生成帖子内容
        String topic = robotConfig.getInterests();
        String title = ContentGenerator.generatePostTitle(topic);
        String content = ContentGenerator.generatePostContent(topic, title);

        // 3. 保存帖子
        // 这里需要注入PostService来保存帖子
        // 暂时只打印日志
        System.out.println("机器人 " + robotConfig.getName() + " 生成帖子: " + title);
    }

    @Override
    public void generateReply(Integer robotId) {
        // 实现机器人回复逻辑
        // 1. 获取机器人配置
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, robotId);
        if (robotConfig == null) {
            return;
        }

        // 2. 查找可回复的帖子
        // 这里需要注入PostService来查询帖子

        // 3. 生成回复内容
        String replyContent = ContentGenerator.generateReply();

        // 4. 保存回复
        // 这里需要注入ReplyService来保存回复
        // 暂时只打印日志
        System.out.println("机器人 " + robotConfig.getName() + " 生成回复: " + replyContent);
    }
}
