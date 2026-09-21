package com.runout.users.internal.application;

import com.runout.users.api.RegisterUserCommand;
import java.util.UUID;

public interface IdentityProviderRegistration {

    UUID register(RegisterUserCommand command);

    void delete(UUID userId);

    void updateRole(UUID userId, String previousRole, String role);
}
