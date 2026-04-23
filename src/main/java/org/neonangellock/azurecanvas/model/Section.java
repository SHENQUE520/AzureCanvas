package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.UUID;

<<<<<<< HEAD
=======
@Setter
@Getter
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
@Entity
@Table(name = "sections")
public class Section {
    // Getters and Setters
    @Id
<<<<<<< HEAD
    @GeneratedValue(strategy = GenerationType.AUTO)
=======
    @GeneratedValue(strategy = GenerationType.IDENTITY)
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    private Integer orderNum = 0;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt = new Date();

<<<<<<< HEAD
    // Manual Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getOrderNum() { return orderNum; }
    public void setOrderNum(Integer orderNum) { this.orderNum = orderNum; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
}
