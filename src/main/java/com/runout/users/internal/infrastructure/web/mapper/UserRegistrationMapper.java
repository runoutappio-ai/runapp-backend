package com.runout.users.internal.infrastructure.web.mapper;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.web.dto.request.RegisterUserRequest;
import com.runout.users.internal.infrastructure.web.dto.response.RegisteredUserResponse;

public final class UserRegistrationMapper {

    private UserRegistrationMapper() {
    }

    public static RegisterUserCommand toCommand(RegisterUserRequest request) {
        return RegisterUserCommand.builder()
                .displayName(request.displayName())
                .email(request.email())
                .password(request.password())
                .build();
    }

    public static RegisteredUserResponse toResponse(UserSummary user) {
        return RegisteredUserResponse.builder()
                .id(user.id())
                .displayName(user.displayName())
                .email(user.email())
                .build();
    }
}
