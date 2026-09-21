package com.runout.authentication.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record RefreshTokenRequest(@NotBlank String refreshToken) {
}
