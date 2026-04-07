package org.neonangellock.azurecanvas.scheduler;

import org.neonangellock.azurecanvas.model.RobotConfig;
import org.neonangellock.azurecanvas.service.RobotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
public class RobotScheduler {

    @Autowired
    private RobotService robotService;

    // 每5分钟检查一次机器人活动
    @Scheduled(fixedRate = 300000)
    public void checkRobotActivity() {
        List<RobotConfig> robots = robotService.findAll();
        LocalTime now = LocalTime.now();
        
        for (RobotConfig robot : robots) {
            if (robot.isEnabled()) {
                // 检查是否在活跃时间范围内
                if (isInActiveTime(robot, now)) {
                    // 这里可以添加更复杂的逻辑来决定是否生成帖子或回复
                    // 目前简单实现，随机生成
                    if (Math.random() > 0.7) {
                        robotService.generatePost(robot.getId());
                    }
                    if (Math.random() > 0.5) {
                        robotService.generateReply(robot.getId());
                    }
                }
            }
        }
    }

    // 检查是否在活跃时间范围内
    private boolean isInActiveTime(RobotConfig robot, LocalTime now) {
        if (robot.getActiveTimeStart() == null || robot.getActiveTimeEnd() == null) {
            return true; // 如果没有设置时间范围，默认一直活跃
        }
        
        LocalTime startTime = LocalTime.parse(robot.getActiveTimeStart());
        LocalTime endTime = LocalTime.parse(robot.getActiveTimeEnd());
        
        return now.isAfter(startTime) && now.isBefore(endTime);
    }
}
