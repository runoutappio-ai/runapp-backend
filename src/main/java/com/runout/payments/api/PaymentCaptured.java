package com.runout.payments.api;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record PaymentCaptured(UUID paymentId, UUID reservationId, Instant occurredAt) {
}
