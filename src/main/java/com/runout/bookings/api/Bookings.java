package com.runout.bookings.api;

import java.util.UUID;

public interface Bookings {
    ReservationSummary create(CreateReservationCommand command);

    UUID recordManualBooking(RecordManualBookingCommand command);

    void confirm(UUID bookingId);
}
