package com.runout.bookings.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record MoneyRequest(
        @DecimalMin(value = "0.01") BigDecimal amount,
        @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency
) {
}
