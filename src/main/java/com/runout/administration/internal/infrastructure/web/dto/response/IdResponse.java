package com.runout.administration.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder
public record IdResponse(UUID id) {
}
