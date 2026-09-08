package com.runout.payments.internal.infrastructure.gateway;

import com.runout.payments.api.CapturePaymentCommand;
import com.runout.payments.api.PaymentGateway;
import com.runout.payments.api.PaymentReceipt;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "runout.payments.provider", havingValue = "mock", matchIfMissing = true)
class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentReceipt capture(CapturePaymentCommand command) {
        if (command.paymentMethodToken().startsWith("pm_fail")) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment was declined");
        }

        var reference = UUID.nameUUIDFromBytes(
                (command.userId() + ":" + command.idempotencyKey()).getBytes(StandardCharsets.UTF_8)
        );
        return new PaymentReceipt("mock_" + reference, "CAPTURED");
    }
}
