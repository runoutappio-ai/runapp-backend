package com.runout.users.api;

import java.util.UUID;

public record UserSummary(UUID id, String displayName, String email) {
}
