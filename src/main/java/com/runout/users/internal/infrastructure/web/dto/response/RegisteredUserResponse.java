package com.runout.users.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder
public record RegisteredUserResponse(UUID id, String displayName, String email) {
}
