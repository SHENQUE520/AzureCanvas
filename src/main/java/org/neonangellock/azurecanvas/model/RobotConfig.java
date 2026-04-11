package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "robot_configs")
public class RobotConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String name;
    private String avatar;
    private String activeTimeStart;
    private String activeTimeEnd;
    private Integer postFrequency;
    private Integer replyFrequency;
    private String interests;
    private boolean enabled = true;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt = new Date();

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getActiveTimeStart() {
        return activeTimeStart;
    }

    public void setActiveTimeStart(String activeTimeStart) {
        this.activeTimeStart = activeTimeStart;
    }

    public String getActiveTimeEnd() {
        return activeTimeEnd;
    }

    public void setActiveTimeEnd(String activeTimeEnd) {
        this.activeTimeEnd = activeTimeEnd;
    }

    public Integer getPostFrequency() {
        return postFrequency;
    }

    public void setPostFrequency(Integer postFrequency) {
        this.postFrequency = postFrequency;
    }

    public Integer getReplyFrequency() {
        return replyFrequency;
    }

    public void setReplyFrequency(Integer replyFrequency) {
        this.replyFrequency = replyFrequency;
    }

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
