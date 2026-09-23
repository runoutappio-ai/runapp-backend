package com.runout.bookings.api;

import lombok.Builder;

import java.util.UUID;

@Builder
public record SubmitReservationFeedbackCommand(
        UUID reservationId,
        UUID userId,
        int rating,
        String comment,
        boolean wouldReturnForSurpriseMenu
) {
}
