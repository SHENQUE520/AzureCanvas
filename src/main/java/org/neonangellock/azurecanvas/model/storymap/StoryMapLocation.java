package org.neonangellock.azurecanvas.model.storymap;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "story_map_locations")
public class StoryMapLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "locationId")
    private UUID locationId;

    @ManyToOne
    @JoinColumn(name = "storyMapId", nullable = false)
    private StoryMap storyMap;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal lat;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal lng;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "imageUrl")
    private String imageUrl;

    @Column(name = "s_order") // order is a reserved word in many DBs
    private Integer order;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updatedAt", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
