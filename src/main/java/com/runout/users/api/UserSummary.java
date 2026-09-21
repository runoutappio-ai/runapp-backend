package com.runout.users.api;

import lombok.Builder;

import java.util.UUID;

@Builder
public record UserSummary(UUID id, String displayName, String email, String role, UserProfile profile) {
}
