package com.runout.payments.api;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

@Builder
public record CapturePaymentCommand(
        UUID userId,
        BigDecimal amount,
        Currency currency,
        String paymentMethodToken,
        UUID idempotencyKey
) {
}
