package com.runout.payments.internal.infrastructure.gateway;

import com.runout.payments.api.CapturePaymentCommand;
import com.runout.payments.api.PaymentReceipt;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

final class MockPaymentMapper {

    private MockPaymentMapper() {
    }

    static PaymentReceipt toCapturedReceipt(CapturePaymentCommand command) {
        var reference = UUID.nameUUIDFromBytes(
                (command.userId() + ":" + command.idempotencyKey()).getBytes(StandardCharsets.UTF_8)
        );
        return PaymentReceipt.builder()
                .reference("mock_" + reference)
                .status("CAPTURED")
                .build();
    }
}
