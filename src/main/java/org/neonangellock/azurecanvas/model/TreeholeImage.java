package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.domain.Persistable;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "treehole_images")
@Getter @Setter
public class TreeholeImage implements Persistable<UUID> {

    @Id
    @Column(name = "imageId", updatable = false, nullable = false)
    private UUID imageId;

    @Column(name = "postId", nullable = false)
    @NotNull(message = "关联树洞帖子不能为空")
    private Integer postId;

    @Column(name = "imageUrl", nullable = false, length = 255)
    @NotNull(message = "图片URL不能为空")
    @Size(max = 255, message = "图片URL长度不能超过255个字符")
    private String imageUrl;

    @Column(name = "\"order\"")
    private Integer order;

    @CreationTimestamp
    @Column(name = "uploadedAt", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @Transient
    private boolean isNew = true;

    @Override
    public UUID getId() {
        return imageId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }
}
