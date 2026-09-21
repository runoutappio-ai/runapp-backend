package com.runout.bookings.internal.infrastructure.web.mapper;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.api.PayReservationCommand;
import com.runout.bookings.api.ReservationSummary;
import com.runout.bookings.internal.infrastructure.web.dto.request.CreateReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.request.PayReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.response.MoneyResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.PaymentResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.SearchAreaResponse;

import java.util.Currency;
import java.util.UUID;

public final class ReservationMapper {

    private ReservationMapper() {
    }

    public static CreateReservationCommand toCommand(UUID id,
                                                     UUID idempotencyKey,
                                                     CreateReservationRequest request) {
        return CreateReservationCommand.builder()
                .userId(id)
                .reservationAt(request.reservationAt().toInstant())
                .timeWindowStartAt(request.timeWindowStartAt() == null ? null : request.timeWindowStartAt().toInstant())
                .timeWindowEndAt(request.timeWindowEndAt() == null ? null : request.timeWindowEndAt().toInstant())
                .excludedCuisineTypes(request.excludedCuisineTypes())
                .vibe(request.vibe())
                .dietaryPreferences(request.dietaryPreferences())
                .allergyNotes(request.allergyNotes())
                .locationLabel(request.locationLabel())
                .partySize(request.partySize())
                .budgetPerPerson(request.budgetPerPerson().amount())
                .totalBudget(request.totalBudget() == null ? null : request.totalBudget().amount())
                .currency(Currency.getInstance(request.budgetPerPerson().currency()))
                .latitude(request.searchArea().latitude())
                .longitude(request.searchArea().longitude())
                .radiusMeters(request.searchArea().radiusMeters())
                .idempotencyKey(idempotencyKey)
                .build();
    }

    public static PayReservationCommand toCommand(UUID userId,
                                                  UUID reservationId,
                                                  UUID idempotencyKey,
                                                  PayReservationRequest request) {
        return PayReservationCommand.builder()
                .userId(userId)
                .reservationId(reservationId)
                .paymentMethodToken(request.paymentMethodToken())
                .idempotencyKey(idempotencyKey)
                .build();
    }

    public static ReservationResponse toResponse(ReservationSummary reservation) {
        var currency = reservation.currency().getCurrencyCode();
        return ReservationResponse.builder()
                .id(reservation.id())
                .status(reservation.status())
                .reservationAt(reservation.reservationAt())
                .timeWindowStartAt(reservation.timeWindowStartAt())
                .timeWindowEndAt(reservation.timeWindowEndAt())
                .excludedCuisineTypes(reservation.excludedCuisineTypes())
                .vibe(reservation.vibe())
                .dietaryPreferences(reservation.dietaryPreferences())
                .allergyNotes(reservation.allergyNotes())
                .locationLabel(reservation.locationLabel())
                .partySize(reservation.partySize())
                .budgetPerPerson(toMoneyResponse(reservation.budgetPerPerson(), currency))
                .totalBudget(toMoneyResponse(reservation.totalBudget(), currency))
                .searchArea(SearchAreaResponse.builder()
                        .latitude(reservation.latitude())
                        .longitude(reservation.longitude())
                        .radiusMeters(reservation.radiusMeters())
                        .build())
                .payment(PaymentResponse.builder()
                        .reference(reservation.paymentReference())
                        .status(reservation.paymentStatus())
                        .build())
                .assignedEmployeeId(reservation.assignedEmployeeId())
                .restaurantId(reservation.restaurantId())
                .externalReference(reservation.externalReference())
                .confirmedReservationAt(reservation.confirmedReservationAt())
                .createdAt(reservation.createdAt())
                .build();
    }

    private static MoneyResponse toMoneyResponse(java.math.BigDecimal amount, String currency) {
        return MoneyResponse.builder()
                .amount(amount)
                .currency(currency)
                .build();
    }
}
