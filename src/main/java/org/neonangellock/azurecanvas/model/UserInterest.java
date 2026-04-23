package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;
@Entity
@Table(name = "user_interest")
<<<<<<< HEAD
public class UserInterest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", updatable = false, nullable = false)
=======
@Getter
@Setter
public class UserInterest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user", updatable = false, nullable = false)
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
    private UUID userId;

    @Column(nullable = false, unique = true, length = 100)
    private String interest;

<<<<<<< HEAD
    // Manual Getters and Setters
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getInterest() { return interest; }
    public void setInterest(String interest) { this.interest = interest; }
=======
>>>>>>> cbc8afc9fcfc514fb98bed1eb0a9dae1e2018167
}
