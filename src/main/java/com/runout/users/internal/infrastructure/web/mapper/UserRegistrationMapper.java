package com.runout.users.internal.infrastructure.web.mapper;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.web.dto.request.RegisterUserRequest;
import com.runout.users.internal.infrastructure.web.dto.response.RegisteredUserResponse;

public final class UserRegistrationMapper {

    private UserRegistrationMapper() {
    }

    public static RegisterUserCommand toCommand(RegisterUserRequest request) {
        return new RegisterUserCommand(
                request.displayName(),
                request.email(),
                request.password()
        );
    }

    public static RegisteredUserResponse toResponse(UserSummary user) {
        return new RegisteredUserResponse(user.id(), user.displayName(), user.email());
    }
}
