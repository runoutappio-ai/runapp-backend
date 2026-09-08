package com.runout.authentication.internal.application;

public interface IdentityProviderAuthentication {

    AuthenticationTokens login(String email, String password);

    AuthenticationTokens refresh(String refreshToken);
}
