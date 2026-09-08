package com.runout.authentication.internal.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final IdentityProviderAuthentication identityProviderAuthentication;

    public AuthenticationTokens login(String email, String password) {
        return identityProviderAuthentication.login(email.trim().toLowerCase(), password);
    }

    public AuthenticationTokens refresh(String refreshToken) {
        return identityProviderAuthentication.refresh(refreshToken);
    }
}
