package com.runout.payments.api;

import java.time.Instant;
import java.util.UUID;

public record PaymentCaptured(UUID paymentId, UUID bookingId, Instant occurredAt) {
}
