package com.runout.bookings.internal.infrastructure.web.dto.response;

import java.math.BigDecimal;

public record MoneyResponse(BigDecimal amount, String currency) {
}
