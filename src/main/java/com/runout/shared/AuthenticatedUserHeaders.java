package com.runout.shared;

import java.util.Set;

public final class AuthenticatedUserHeaders {

    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    public static final String USER_ID = "X-Authenticated-User-Id";
    public static final String EMAIL = "X-Authenticated-User-Email";
    public static final String USERNAME = "X-Authenticated-Username";
    public static final String DISPLAY_NAME = "X-Authenticated-User-Name";

    public static final Set<String> ALL = Set.of(
            USER_ID,
            EMAIL,
            USERNAME,
            DISPLAY_NAME
    );

    private AuthenticatedUserHeaders() {
    }
}
