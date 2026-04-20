package org.neonangellock.azurecanvas.model.storymap;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "story_maps")
public class StoryMap {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "storyMapId", nullable = false)
    private UUID storyMapId;

    @OneToOne(mappedBy = "storyMap", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // mappedBy points to the field in StoryMapStats that owns the relationship.
    // CascadeType.ALL: changes in StoryMap cascade to StoryMapStats (e.g., delete)
    // FetchType.LAZY: Only load StoryMapStats when explicitly accessed.
    private StoryMapStats stats;

    @Column(name = "authorId", nullable = false)
    private UUID authorId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "coverImageUrl")
    private String coverImageUrl;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updatedAt", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "storyMap", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<StoryMapLocation> locations;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
