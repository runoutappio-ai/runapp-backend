package com.runout.administration.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateGroupRequest(
        @NotNull UUID experienceId,
        @NotEmpty List<UUID> participantIds
) {
}
