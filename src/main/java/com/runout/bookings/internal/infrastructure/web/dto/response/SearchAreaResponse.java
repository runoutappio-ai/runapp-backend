package com.runout.bookings.internal.infrastructure.web.dto.response;

import java.math.BigDecimal;

public record SearchAreaResponse(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
}
