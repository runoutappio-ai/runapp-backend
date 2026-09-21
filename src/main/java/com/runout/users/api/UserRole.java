package com.runout.users.api;

import java.util.Locale;

public enum UserRole {
    SUPER_ADMIN,
    MANAGER,
    WORKER,
    USER;

    public static UserRole from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("User role is required");
        }

        try {
            return valueOf(value.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("Unsupported user role: " + value, error);
        }
    }
}
