package com.runout.users.internal.application;

import com.runout.users.api.RegisterUserCommand;

public interface IdentityProviderRegistration {

    String register(RegisterUserCommand command);

    void delete(String identityProviderSubject);
}
