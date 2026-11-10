package com.runout.payments.api;

import org.springframework.http.HttpHeaders;

import java.util.Optional;
import java.util.UUID;

public interface CheckoutGateway {
    String provider();

    Attempt start(Channel channel, Charge charge, String previousAttemptId);

    Attempt retrieve(Channel channel, String attemptId);

    Attempt close(Channel channel, String attemptId);

    Optional<PaidPayment> verifyPaidEvent(String payload, HttpHeaders headers);

    enum Channel { HOSTED, NATIVE }

    enum State { READY, PROCESSING, CLOSED, PAID }

    record Charge(UUID reservationId, long amountInMinorUnits, String currency) {}

    // For a ready attempt the launch value is a hosted URL or a native client credential.
    record Attempt(String id, State state, String launchValue, PaidPayment payment) {
        public boolean ready() { return state == State.READY && launchValue != null; }
    }

    record PaidPayment(String id, Long amountInMinorUnits, String currency, UUID reservationId) {}
}
