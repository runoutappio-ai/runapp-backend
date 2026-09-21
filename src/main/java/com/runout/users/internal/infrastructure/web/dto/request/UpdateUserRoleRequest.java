package com.runout.users.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRoleRequest(@NotBlank String role) {
}
