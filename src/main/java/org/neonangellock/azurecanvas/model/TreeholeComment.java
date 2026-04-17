package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "treehole_comments")
public class TreeholeComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String authorName;

    private String authorAvatar;

    private boolean isRobotComment = false;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private TreeholePost post;

    @ManyToOne
    @JoinColumn(name = "robot_id")
    private RobotConfig robot;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorAvatar() {
        return authorAvatar;
    }

    public void setAuthorAvatar(String authorAvatar) {
        this.authorAvatar = authorAvatar;
    }

    public boolean isRobotComment() {
        return isRobotComment;
    }

    public void setRobotComment(boolean robotComment) {
        isRobotComment = robotComment;
    }

    public TreeholePost getPost() {
        return post;
    }

    public void setPost(TreeholePost post) {
        this.post = post;
    }

    public RobotConfig getRobot() {
        return robot;
    }

    public void setRobot(RobotConfig robot) {
        this.robot = robot;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
