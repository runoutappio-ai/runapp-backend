package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.api.ReservationService;
import com.runout.bookings.api.ReservationSummary;
import com.runout.bookings.internal.infrastructure.web.dto.request.CreateReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.request.PayReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationRevealResponse;
import com.runout.bookings.internal.infrastructure.web.mapper.ReservationMapper;
import com.runout.restaurants.api.RestaurantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.IDEMPOTENCY_KEY;
import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Slf4j
@Validated
class ReservationController {

    private final ReservationService reservations;
    private final RestaurantService restaurants;

    @GetMapping
    List<ReservationResponse> findAll(@RequestHeader(USER_ID) UUID userId) {
        log.info("Listing reservations for userId={}", userId);
        return reservations.findAllForUser(userId).stream()
                .map(ReservationMapper::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    ReservationResponse findById(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        log.info("Retrieving reservation id={} for userId={}", id, userId);
        var reservation = reservations.findByIdForUser(id, userId);
        return ReservationMapper.toResponse(reservation);
    }

    @GetMapping("/{id}/reveal")
    ReservationRevealResponse reveal(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        log.info("Revealing reservation id={} for userId={}", id, userId);
        var reservation = reservations.findByIdForUser(id, userId);
        if (!"SENT_TO_USER".equals(reservation.status()) || reservation.restaurantId() == null) {
            return ReservationRevealResponse.builder()
                    .available(false)
                    .status(reservation.status())
                    .reservation(ReservationMapper.toResponse(reservation))
                    .build();
        }

        var restaurant = restaurants.findById(reservation.restaurantId());
        return ReservationRevealResponse.builder()
                .available(true)
                .status(reservation.status())
                .reservation(ReservationMapper.toResponse(reservation))
                .restaurant(restaurant)
                .menu(restaurants.findMenu(restaurant.id()))
                .build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReservationResponse create(@RequestHeader(USER_ID) UUID userId,
                               @RequestHeader(IDEMPOTENCY_KEY) @NotNull UUID idempotencyKey,
                               @Valid @RequestBody CreateReservationRequest request) {
        log.info("Creating reservation for userId={} idempotencyKey={}", userId, idempotencyKey);
        var command = ReservationMapper.toCommand(userId, idempotencyKey, request);
        ReservationSummary reservation = reservations.create(command);
        return ReservationMapper.toResponse(reservation);
    }

    @PostMapping("/{id}/payments")
    ReservationResponse pay(@RequestHeader(USER_ID) UUID userId,
                            @RequestHeader(IDEMPOTENCY_KEY) @NotNull UUID idempotencyKey,
                            @PathVariable UUID id,
                            @Valid @RequestBody PayReservationRequest request) {
        log.info("Paying reservation id={} for userId={} idempotencyKey={}", id, userId, idempotencyKey);
        var command = ReservationMapper.toCommand(userId, id, idempotencyKey, request);
        ReservationSummary reservation = reservations.pay(command);
        return ReservationMapper.toResponse(reservation);
    }

    @PostMapping("/{id}/cancellation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void cancel(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        log.info("Cancelling reservation id={} for userId={}", id, userId);
        reservations.cancel(id, userId);
    }
}
