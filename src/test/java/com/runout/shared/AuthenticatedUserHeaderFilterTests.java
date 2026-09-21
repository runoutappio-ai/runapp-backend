package com.runout.shared;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AuthenticatedUserHeaderFilterTests {

    private final AuthenticatedUserHeaderFilter filter = new AuthenticatedUserHeaderFilter();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void replacesUntrustedIdentityHeadersWithAuthenticatedJwtClaims() throws Exception {
        var issuedAt = Instant.parse("2026-09-09T10:00:00Z");
        var expiresAt = Instant.parse("2026-09-09T10:05:00Z");
        var jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("keycloak-user-id")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("email", "ana@example.com")
                .claim("preferred_username", "ana@example.com")
                .claim("name", "Ana Example")
                .build();
        var authentication = new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        var request = new MockHttpServletRequest();
        request.addHeader(AuthenticatedUserHeaders.USER_ID, "spoofed-user-id");
        var filteredRequest = new AtomicReference<HttpServletRequest>();

        filter.doFilter(
                request,
                new MockHttpServletResponse(),
                (wrappedRequest, response) -> filteredRequest.set((HttpServletRequest) wrappedRequest)
        );

        assertEquals(
                "keycloak-user-id",
                filteredRequest.get().getHeader(AuthenticatedUserHeaders.USER_ID)
        );
        assertEquals("ana@example.com", filteredRequest.get().getHeader(AuthenticatedUserHeaders.EMAIL));
        assertEquals("Ana Example", filteredRequest.get().getHeader(AuthenticatedUserHeaders.DISPLAY_NAME));
    }

    @Test
    void removesClientSuppliedIdentityHeadersFromUnauthenticatedRequests() throws Exception {
        var request = new MockHttpServletRequest();
        request.addHeader(AuthenticatedUserHeaders.EMAIL, "attacker@example.com");
        var filteredRequest = new AtomicReference<HttpServletRequest>();

        filter.doFilter(
                request,
                new MockHttpServletResponse(),
                (wrappedRequest, response) -> filteredRequest.set((HttpServletRequest) wrappedRequest)
        );

        assertNull(filteredRequest.get().getHeader(AuthenticatedUserHeaders.EMAIL));
    }
}
