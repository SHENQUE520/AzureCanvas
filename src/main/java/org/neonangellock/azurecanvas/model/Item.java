package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "items")
<<<<<<< HEAD
=======
@Getter @Setter
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "itemId", updatable = false, nullable = false)
    private UUID itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sellerId", nullable = false)
    private User seller;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 100)
    private String category;

    @Column(nullable = false, length = 50)
    private String status = "available";

    @Column(length = 255)
    private String location;

    @Column(nullable = false)
    private Integer views = 0;

    @Column(nullable = false)
    private Byte quality = 90;

    @Column(nullable = false)
    private boolean isUrgent = false;

    @Column(nullable = false)
    private boolean isFreeShipping = false;

    @Column(nullable = false)
    private boolean canInspect = false;

    @CreationTimestamp
    @Column(name = "createdAt", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt", nullable = false)
    private OffsetDateTime updatedAt;
<<<<<<< HEAD

    // Getters and Setters
    public UUID getItemId() { return itemId; }
    public void setItemId(UUID itemId) { this.itemId = itemId; }
    public User getSeller() { return seller; }
    public void setSeller(User seller) { this.seller = seller; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }
    public Byte getQuality() { return quality; }
    public void setQuality(Byte quality) { this.quality = quality; }
    public boolean isUrgent() { return isUrgent; }
    public void setUrgent(boolean urgent) { isUrgent = urgent; }
    public boolean isFreeShipping() { return isFreeShipping; }
    public void setFreeShipping(boolean freeShipping) { isFreeShipping = freeShipping; }
    public boolean isCanInspect() { return canInspect; }
    public void setCanInspect(boolean canInspect) { this.canInspect = canInspect; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
}