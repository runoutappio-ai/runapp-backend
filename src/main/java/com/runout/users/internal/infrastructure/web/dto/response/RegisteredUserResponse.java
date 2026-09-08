package com.runout.users.internal.infrastructure.web.dto.response;

import java.util.UUID;

public record RegisteredUserResponse(UUID id, String displayName, String email) {
}
