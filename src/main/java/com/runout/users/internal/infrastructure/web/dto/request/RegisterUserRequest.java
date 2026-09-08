package com.runout.users.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(@NotBlank @Size(max = 120) String displayName,
                                  @NotBlank @Email @Size(max = 320) String email,
                                  @NotBlank @Size(min = 12, max = 128) String password
) {
}
