package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.api.Bookings;
import com.runout.bookings.internal.infrastructure.web.dto.request.CreateReservationRequest;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import com.runout.bookings.internal.infrastructure.web.mapper.ReservationMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Validated
class ReservationController {

    private final Bookings bookings;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReservationResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Idempotency-Key") @NotBlank @Size(max = 160) String idempotencyKey,
            @Valid @RequestBody CreateReservationRequest request
    ) {
        var command = ReservationMapper.toCommand(jwt.getSubject(), idempotencyKey, request);
        return ReservationMapper.toResponse(bookings.create(command));
    }
}
