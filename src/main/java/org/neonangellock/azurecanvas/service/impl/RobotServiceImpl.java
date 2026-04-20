package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.RobotConfig;
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.RobotService;
import org.neonangellock.azurecanvas.service.TreeholeService;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.util.ContentGenerator;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

@Service
public class RobotServiceImpl extends AbstractQueryService implements RobotService {
    private final UserService userService;
    private final TreeholeService treeholeService;

    public RobotServiceImpl(EntityManager entityManager, UserService userService, TreeholeService treeholeService) {
        super(entityManager);
        this.userService = userService;
        this.treeholeService = treeholeService;
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
            User user = new User();
            user.setUsername("robot_" + System.currentTimeMillis());
            user.setPassword("robot_password");
            user.setEmail("robot_" + System.currentTimeMillis() + "@example.com");
            user.setRole(User.Role.user);
            user.setRobot(true);
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
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, robotId);
        if (robotConfig == null) {
            return;
        }

        String topic = robotConfig.getInterests();
        String title = ContentGenerator.generatePostTitle(topic);
        String content = ContentGenerator.generatePostContent(topic, title);

        TreeholePost post = treeholeService.createRobotPost(robotId, content);
        if (post != null) {
            System.out.println("机器人 " + robotConfig.getName() + " 在树洞发布帖子: " + content.substring(0, Math.min(50, content.length())) + "...");
        }
    }

    @Override
    public void generateReply(Integer robotId) {
        RobotConfig robotConfig = entityManager.find(RobotConfig.class, robotId);
        if (robotConfig == null) {
            return;
        }

        List<TreeholePost> recentPosts = treeholeService.findRecentPosts(10);
        if (recentPosts.isEmpty()) {
            return;
        }

        TreeholePost targetPost = recentPosts.get((int) (Math.random() * recentPosts.size()));
        
        String replyContent = ContentGenerator.generateReply();

        TreeholeComment comment = treeholeService.createRobotComment(robotId, targetPost.getId(), replyContent);
        if (comment != null) {
            System.out.println("机器人 " + robotConfig.getName() + " 在树洞回复帖子: " + replyContent);
        }
    }
}
