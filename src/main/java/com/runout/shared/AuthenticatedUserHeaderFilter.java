package com.runout.shared;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
public class AuthenticatedUserHeaderFilter extends OncePerRequestFilter {

    private static final Set<String> TRUSTED_HEADER_NAMES = AuthenticatedUserHeaders.ALL.stream()
            .map(name -> name.toLowerCase(Locale.ROOT))
            .collect(java.util.stream.Collectors.toUnmodifiableSet());

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        var trustedHeaders = new LinkedHashMap<String, String>();

        if (authentication instanceof JwtAuthenticationToken jwtAuthentication
                && jwtAuthentication.isAuthenticated()) {
            var jwt = jwtAuthentication.getToken();
            putIfPresent(trustedHeaders, AuthenticatedUserHeaders.USER_ID, jwt.getSubject());
            putIfPresent(trustedHeaders, AuthenticatedUserHeaders.EMAIL, jwt.getClaimAsString("email"));
            putIfPresent(trustedHeaders, AuthenticatedUserHeaders.USERNAME, jwt.getClaimAsString("preferred_username"));
            putIfPresent(trustedHeaders, AuthenticatedUserHeaders.DISPLAY_NAME, jwt.getClaimAsString("name"));
        }

        filterChain.doFilter(new TrustedHeadersRequest(request, trustedHeaders), response);
    }

    private void putIfPresent(Map<String, String> headers, String name, String value) {
        if (value != null && !value.isBlank()) {
            headers.put(name, sanitize(value));
        }
    }

    private String sanitize(String value) {
        return value.replace("\r", "").replace("\n", "");
    }

    private static final class TrustedHeadersRequest extends HttpServletRequestWrapper {

        private final Map<String, String> trustedHeaders;

        private TrustedHeadersRequest(HttpServletRequest request, Map<String, String> trustedHeaders) {
            super(request);
            this.trustedHeaders = Map.copyOf(trustedHeaders);
        }

        @Override
        public String getHeader(String name) {
            var trustedValue = trustedHeader(name);
            if (trustedValue != null) {
                return trustedValue;
            }
            if (isTrustedHeader(name)) {
                return null;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            var trustedValue = trustedHeader(name);
            if (trustedValue != null) {
                return Collections.enumeration(Set.of(trustedValue));
            }
            if (isTrustedHeader(name)) {
                return Collections.emptyEnumeration();
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            var names = new LinkedHashSet<String>();
            var originalNames = super.getHeaderNames();
            while (originalNames != null && originalNames.hasMoreElements()) {
                var name = originalNames.nextElement();
                if (!isTrustedHeader(name)) {
                    names.add(name);
                }
            }
            names.addAll(trustedHeaders.keySet());
            return Collections.enumeration(names);
        }

        private String trustedHeader(String name) {
            return trustedHeaders.entrySet().stream()
                    .filter(entry -> entry.getKey().equalsIgnoreCase(name))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(null);
        }

        private boolean isTrustedHeader(String name) {
            return name != null && TRUSTED_HEADER_NAMES.contains(name.toLowerCase(Locale.ROOT));
        }
    }
}
