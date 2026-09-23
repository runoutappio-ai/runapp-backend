package com.runout.bookings.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.time.Instant;

@Builder
public record ReservationFeedbackResponse(
        int rating,
        String comment,
        boolean wouldReturnForSurpriseMenu,
        Instant submittedAt
) {
}
