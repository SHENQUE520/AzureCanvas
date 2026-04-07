-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    avatar VARCHAR(255),
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    is_robot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建板块表
CREATE TABLE IF NOT EXISTS sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建帖子表
CREATE TABLE IF NOT EXISTS posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    section_id INT NOT NULL,
    status ENUM('normal', 'pinned', '精华', 'locked') DEFAULT 'normal',
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- 创建回复表
CREATE TABLE IF NOT EXISTS replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES replies(id) ON DELETE CASCADE
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    target_id INT NOT NULL,
    target_type ENUM('post', 'reply') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, target_id, target_type)
);

-- 插入默认板块数据
INSERT INTO sections (name, description, order_num) VALUES
('校园生活', '分享校园日常、活动和经验', 1),
('学习交流', '讨论学习心得、考试经验和学术问题', 2),
('兴趣爱好', '分享各种兴趣爱好和特长', 3),
('二手交易', '发布和求购二手物品', 4),
('求助问答', '提出问题，寻求帮助', 5);

-- 插入默认管理员用户
INSERT INTO users (username, password, email, role) VALUES
('xinghe', '123456', 'xinghe@example.com', 'admin');

-- 插入一些测试帖子
INSERT INTO posts (title, content, user_id, section_id) VALUES
('欢迎来到星河论坛', '这是论坛的第一篇帖子，欢迎大家加入讨论！', 1, 1),
('期末考试复习资料分享', '分享一些期末考试的复习资料，希望对大家有帮助', 1, 2),
('有人一起打篮球吗？', '周六下午3点，体育馆见！', 1, 3),
('出售二手 textbooks', '去年的 textbooks，几乎全新，价格可议', 1, 4),
('请教一个编程问题', '如何使用Spring Boot实现RESTful API？', 1, 5);

-- 插入一些测试回复
INSERT INTO replies (content, user_id, post_id) VALUES
('欢迎欢迎！', 1, 1),
('谢谢分享！', 1, 2),
('我参加！', 1, 3),
('多少钱？', 1, 4),
('可以参考官方文档，很详细', 1, 5);

-- 创建机器人配置表
CREATE TABLE IF NOT EXISTS robot_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    active_time_start TIME,
    active_time_end TIME,
    post_frequency INT,
    reply_frequency INT,
    interests TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
