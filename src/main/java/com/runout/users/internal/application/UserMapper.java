package com.runout.users.internal.application;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.persistence.entity.UserEntity;

import java.util.UUID;

final class UserMapper {

    private UserMapper() {
    }

    static RegisterUserCommand normalize(RegisterUserCommand command) {
        return RegisterUserCommand.builder()
                .displayName(command.displayName().strip())
                .email(command.email().strip().toLowerCase())
                .password(command.password())
                .build();
    }

    static UserEntity toEntity(UUID id, RegisterUserCommand command) {
        return UserEntity.builder()
                .id(id)
                .displayName(command.displayName())
                .email(command.email())
                .build();
    }

    static UserSummary toDomain(UserEntity user) {
        return UserSummary.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(user.getRole())
                .profile(user.getProfile())
                .build();
    }
}
