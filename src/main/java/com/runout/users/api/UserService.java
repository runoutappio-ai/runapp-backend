package com.runout.users.api;

import java.util.List;
import java.util.UUID;

public interface UserService {

    List<UserSummary> findAll();

    List<UserSummary> findAllActiveByRole(UserRole role);

    UserSummary register(RegisterUserCommand command);

    UserSummary createStaff(RegisterUserCommand command, UserRole role);

    UserSummary provisionAuthenticatedUser(UUID userId, String email, String displayName, String username);

    UserSummary requireActive(UUID userId);

    UserSummary findByUserId(UUID id);

    UserSummary updateRole(UUID userId, String role);
}
