package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "treehole_posts")
public class TreeholePost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String title;

    private String category;

    private String images;

    @Column(name = "user_id")
    private UUID userId;

    private Integer likeCount = 0;

    private Integer commentCount = 0;

    private boolean isRobotPost = false;

    @ManyToOne
    @JoinColumn(name = "robot_id")
    private RobotConfig robot;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TreeholeComment> comments = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt = new Date();

    public boolean isRobotPost() {
        return isRobotPost;
    }

    public void setRobotPost(boolean robotPost) {
        isRobotPost = robotPost;
    }

}
