package org.neonangellock.azurecanvas.dto;

import lombok.Data;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.UserInterest;

import java.time.OffsetDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
public class UserDTO {
    private UUID userId;
    private String username;
    private String email;
    private String avatar;
    private String bio;
    private User.Gender gender;
    private OffsetDateTime joinedAt;
    private Date birthDate;
    private User.Role role;
    private boolean isRobot;
    private List<String> interests;

    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatarUrl());
        dto.setBio(user.getBio());
        dto.setGender(user.getGender());
        dto.setJoinedAt(user.getJoinedAt());
        dto.setBirthDate(user.getBirthDate());
        dto.setRole(user.getRole());
        dto.setRobot(user.isRobot());
        if (user.getInterests() != null) {
            dto.setInterests(user.getInterests().stream()
                    .map(UserInterest::getInterest)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public static UserDTO fromEntity(User user, List<String> interests) {
        UserDTO dto = fromEntity(user);
        dto.setInterests(interests);
        return dto;
    }
}
