package com.runout.bookings.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record MoneyResponse(BigDecimal amount, String currency) {
}
