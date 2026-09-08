package com.runout.notifications.internal.application;

import com.runout.bookings.api.BookingConfirmed;
import com.runout.matching.api.GroupFormed;
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
    void on(GroupFormed event) {
        log.info("Queue group-formed notification for {} users", event.participantIds().size());
    }

    @ApplicationModuleListener
    void on(BookingConfirmed event) {
        log.info("Queue booking-confirmed notification for booking {}", event.bookingId());
    }

    @ApplicationModuleListener
    void on(PaymentCaptured event) {
        log.info("Queue payment receipt for payment {}", event.paymentId());
    }
}
