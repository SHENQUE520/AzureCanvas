package org.neonangellock.azurecanvas.model.storymap;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Getter @Setter
@Table(name = "story_map_stats")
public class StoryMapStats {
    @Id // PK of this entity
    @Column(name = "storymapid", nullable = false)
    private UUID storyMapId; // This will store the FK value

    @OneToOne(fetch = FetchType.LAZY) // LAZY is good for performance
    @MapsId // This is the crucial annotation: indicates that the PK of this entity is also the FK to the referenced entity
    @JoinColumn(name = "storymapid") // The FK column name in this table pointing to story_maps
    private StoryMap storyMap; // The referenced StoryMap entity

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "authorId", nullable = false)
    private UUID authorId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now(); // 创建时间 (如果数据库支持时区，使用OffsetDateTime更好)

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "likescount", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int likesCount; // 点赞数

    @Column(name = "viewscount", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int viewsCount;
}
