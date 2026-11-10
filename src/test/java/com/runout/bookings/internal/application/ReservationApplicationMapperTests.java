package com.runout.bookings.internal.application;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.api.PayReservationCommand;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReservationApplicationMapperTests {
    @Test
    void chargesOnlyTenPercentOfTheSavedTableBudget() {
        var capture = captureFor(new BigDecimal("123.45"));
        assertThat(capture).isEqualByComparingTo("12.35");
    }

    @Test
    void calculatesFeeFromPerPersonBudgetWhenTableBudgetWasOmitted() {
        assertThat(captureFor(null)).isEqualByComparingTo("60.00");
    }

    private BigDecimal captureFor(BigDecimal totalBudget) {
        var userId = UUID.randomUUID();
        var reservation = ReservationApplicationMapper.toReservationEntity(userId, CreateReservationCommand.builder()
                .partySize(4)
                .budgetPerPerson(new BigDecimal("150.00"))
                .totalBudget(totalBudget)
                .currency(Currency.getInstance("AED"))
                .excludedCuisineTypes(List.of())
                .build());
        var payment = PayReservationCommand.builder().userId(userId).reservationId(reservation.getId()).build();
        return ReservationApplicationMapper.toCapturePaymentCommand(reservation, payment).amount();
    }
}
