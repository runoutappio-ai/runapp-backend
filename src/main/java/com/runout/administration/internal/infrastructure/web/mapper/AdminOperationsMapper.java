package com.runout.administration.internal.infrastructure.web.mapper;

import com.runout.administration.internal.infrastructure.web.dto.request.CreateExperienceRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.ConfirmReservationRequest;
import com.runout.administration.internal.infrastructure.web.dto.response.AdminReservationResponse;
import com.runout.administration.internal.infrastructure.web.dto.response.IdResponse;
import com.runout.bookings.api.ConfirmReservationCommand;
import com.runout.bookings.api.ReservationSummary;
import com.runout.experiences.api.CreateExperienceCommand;

import java.util.UUID;

public final class AdminOperationsMapper {

    private AdminOperationsMapper() {
    }

    public static CreateExperienceCommand toCommand(CreateExperienceRequest request) {
        return CreateExperienceCommand.builder()
                .title(request.title())
                .startsAt(request.startsAt())
                .capacity(request.capacity())
                .build();
    }

    public static ConfirmReservationCommand toCommand(UUID reservationId, ConfirmReservationRequest request) {
        return ConfirmReservationCommand.builder()
                .reservationId(reservationId)
                .restaurantId(request.restaurantId())
                .externalReference(request.externalReference())
                .reservedAt(request.reservedAt())
                .build();
    }

    public static IdResponse toIdResponse(UUID id) {
        return IdResponse.builder()
                .id(id)
                .build();
    }

    public static AdminReservationResponse toResponse(ReservationSummary reservation) {
        var currency = reservation.currency().getCurrencyCode();
        return AdminReservationResponse.builder()
                .id(reservation.id())
                .status(reservation.status())
                .reservationAt(reservation.reservationAt())
                .excludedCuisineTypes(reservation.excludedCuisineTypes())
                .partySize(reservation.partySize())
                .budgetPerPerson(AdminReservationResponse.MoneyResponse.builder()
                        .amount(reservation.budgetPerPerson())
                        .currency(currency)
                        .build())
                .totalBudget(AdminReservationResponse.MoneyResponse.builder()
                        .amount(reservation.totalBudget())
                        .currency(currency)
                        .build())
                .searchArea(AdminReservationResponse.SearchAreaResponse.builder()
                        .latitude(reservation.latitude())
                        .longitude(reservation.longitude())
                        .radiusMeters(reservation.radiusMeters())
                        .build())
                .payment(AdminReservationResponse.PaymentResponse.builder()
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
}
