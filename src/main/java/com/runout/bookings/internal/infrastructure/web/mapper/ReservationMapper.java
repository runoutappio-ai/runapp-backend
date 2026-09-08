package com.runout.bookings.internal.infrastructure.web.mapper;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.api.ReservationSummary;
import com.runout.bookings.internal.infrastructure.web.dto.request.CreateReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.response.MoneyResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.PaymentResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.SearchAreaResponse;

import java.util.Currency;

public final class ReservationMapper {

    private ReservationMapper() {
    }

    public static CreateReservationCommand toCommand(
            String identityProviderSubject,
            String idempotencyKey,
            CreateReservationRequest request
    ) {
        return new CreateReservationCommand(
                identityProviderSubject,
                request.reservationAt().toInstant(),
                request.excludedCuisineTypes(),
                request.partySize(),
                request.budgetPerPerson().amount(),
                Currency.getInstance(request.budgetPerPerson().currency()),
                request.searchArea().latitude(),
                request.searchArea().longitude(),
                request.searchArea().radiusMeters(),
                request.paymentMethodToken(),
                idempotencyKey
        );
    }

    public static ReservationResponse toResponse(ReservationSummary reservation) {
        var currency = reservation.currency().getCurrencyCode();
        return new ReservationResponse(
                reservation.id(),
                reservation.status(),
                reservation.reservationAt(),
                reservation.excludedCuisineTypes(),
                reservation.partySize(),
                new MoneyResponse(reservation.budgetPerPerson(), currency),
                new MoneyResponse(reservation.totalBudget(), currency),
                new SearchAreaResponse(
                        reservation.latitude(),
                        reservation.longitude(),
                        reservation.radiusMeters()
                ),
                new PaymentResponse(reservation.paymentReference(), reservation.paymentStatus()),
                reservation.createdAt()
        );
    }
}
