package com.runout.payments.api;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

public record CapturePaymentCommand(
        UUID userId,
        BigDecimal amount,
        Currency currency,
        String paymentMethodToken,
        String idempotencyKey
) {
}
