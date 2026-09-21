package com.runout.bookings.internal.domain;

public enum ReservationStatus {
    PAYMENT_PENDING,
    PAID,
    PAYMENT_FAILED,
    CANCELLED,
    ASSIGNED,
    IN_PROGRESS,
    CONFIRMED,
    REJECTED,
    SENT_TO_USER,
    COMPLETED
}
