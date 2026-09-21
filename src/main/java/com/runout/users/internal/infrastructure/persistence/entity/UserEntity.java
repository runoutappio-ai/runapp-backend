package com.runout.users.internal.infrastructure.persistence.entity;

import com.runout.users.api.UserProfile;
import com.runout.users.api.UserRole;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "app_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserEntity {

    @Id
    private UUID id;
    private String displayName;
    private String email;
    private boolean active;
    private String role;
    @JdbcTypeCode(SqlTypes.JSON)
    private UserProfile profile;

    @Builder
    public UserEntity(UUID id, String displayName, String email) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.active = true;
        this.role = UserRole.USER.name();
    }

    public void updateProfile(UserProfile profile) {
        this.profile = profile;
    }

    public void updateRole(String role) {
        this.role = role;
    }
}
