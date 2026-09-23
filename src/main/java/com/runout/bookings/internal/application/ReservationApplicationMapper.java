package com.runout.bookings.internal.application;

import com.runout.bookings.api.*;
import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.payments.api.CapturePaymentCommand;

import java.time.Instant;
import java.util.Currency;
import java.util.UUID;

final class ReservationApplicationMapper {

    private ReservationApplicationMapper() {
    }

    static CapturePaymentCommand toCapturePaymentCommand(ReservationEntity reservation, PayReservationCommand command) {
        return CapturePaymentCommand.builder()
                .userId(command.userId())
                .amount(reservation.getTotalBudget())
                .currency(Currency.getInstance(reservation.getCurrency()))
                .paymentMethodToken(command.paymentMethodToken())
                .idempotencyKey(command.idempotencyKey())
                .build();
    }

    static ReservationEntity toReservationEntity(UUID userId,
                                                 CreateReservationCommand command
    ) {
        return ReservationEntity.builder()
                .userId(userId)
                .command(command)
                .build();
    }

    static ReservationConfirmed toReservationConfirmed(ReservationEntity reservation) {
        return ReservationConfirmed.builder()
                .reservationId(reservation.getId())
                .restaurantId(reservation.getRestaurantId())
                .externalReference(reservation.getExternalReference())
                .reservedAt(reservation.getConfirmedReservationAt())
                .occurredAt(Instant.now())
                .build();
    }

    static ReservationSummary toSummary(ReservationEntity reservation) {
        return ReservationSummary.builder()
                .id(reservation.getId())
                .status(reservation.getStatus().name())
                .reservationAt(reservation.getReservationAt())
                .timeWindowStartAt(reservation.getTimeWindowStartAt())
                .timeWindowEndAt(reservation.getTimeWindowEndAt())
                .excludedCuisineTypes(reservation.getExcludedCuisineTypes().stream().toList())
                .vibe(reservation.getVibe())
                .dietaryPreferences(reservation.getDietaryPreferences().stream().toList())
                .allergyNotes(reservation.getAllergyNotes())
                .locationLabel(reservation.getLocationLabel())
                .partySize(reservation.getPartySize())
                .budgetPerPerson(reservation.getBudgetPerPerson())
                .totalBudget(reservation.getTotalBudget())
                .currency(Currency.getInstance(reservation.getCurrency()))
                .latitude(reservation.getLatitude())
                .longitude(reservation.getLongitude())
                .radiusMeters(reservation.getRadiusMeters())
                .paymentReference(reservation.getPaymentReference())
                .paymentStatus(reservation.getPaymentStatus())
                .assignedEmployeeId(reservation.getAssignedEmployeeId())
                .restaurantId(reservation.getRestaurantId())
                .externalReference(reservation.getExternalReference())
                .confirmedReservationAt(reservation.getConfirmedReservationAt())
                .feedbackRating(reservation.getFeedbackRating())
                .feedbackComment(reservation.getFeedbackComment())
                .feedbackWouldReturnForSurpriseMenu(reservation.getFeedbackWouldReturnForSurpriseMenu())
                .feedbackSubmittedAt(reservation.getFeedbackSubmittedAt())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
