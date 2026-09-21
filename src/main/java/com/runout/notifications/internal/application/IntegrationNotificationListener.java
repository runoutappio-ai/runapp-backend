package com.runout.notifications.internal.application;

import com.runout.bookings.api.ReservationConfirmed;
import com.runout.payments.api.PaymentCaptured;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class IntegrationNotificationListener {
    private static final Logger log = LoggerFactory.getLogger(IntegrationNotificationListener.class);

    @ApplicationModuleListener
    void on(ReservationConfirmed event) {
        log.info("Queue reservation-confirmed notification for reservation {}", event.reservationId());
    }

    @ApplicationModuleListener
    void on(PaymentCaptured event) {
        log.info("Queue payment receipt for payment {}", event.paymentId());
    }
}
