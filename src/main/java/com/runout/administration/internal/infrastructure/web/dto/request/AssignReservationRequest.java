package com.runout.administration.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignReservationRequest(@NotNull UUID employeeId) {
}
