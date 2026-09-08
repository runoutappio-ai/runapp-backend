package com.runout.users.internal.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "app_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserEntity {

    @Id
    private UUID id;
    private String identityProviderSubject;
    private String displayName;
    private String email;
    private boolean active;

    public UserEntity(String identityProviderSubject, String displayName, String email) {
        this.id = UUID.randomUUID();
        this.identityProviderSubject = identityProviderSubject;
        this.displayName = displayName;
        this.email = email;
        this.active = true;
    }
}
