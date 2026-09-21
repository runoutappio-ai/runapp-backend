package com.runout.bookings.internal.infrastructure.web.dto.response;

import lombok.Builder;

@Builder
public record PaymentResponse(String reference, String status) {
}
