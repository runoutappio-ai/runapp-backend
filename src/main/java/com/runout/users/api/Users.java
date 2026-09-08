package com.runout.users.api;

import java.util.UUID;

public interface Users {

    UserSummary register(RegisterUserCommand command);

    UserSummary requireActive(UUID userId);

    UserSummary requireActiveByIdentityProviderSubject(String identityProviderSubject);
}
