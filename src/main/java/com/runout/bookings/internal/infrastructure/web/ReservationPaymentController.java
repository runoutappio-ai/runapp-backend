package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.internal.application.ReservationPayments;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import com.runout.bookings.internal.infrastructure.web.mapper.ReservationMapper;
import com.runout.payments.api.CheckoutGateway.Channel;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequiredArgsConstructor
class ReservationPaymentController {
    private final ReservationPayments payments;

    @PostMapping("/api/v1/reservations/{id}/checkout")
    HostedPayment createCheckout(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        var checkout = payments.open(id, userId, Channel.HOSTED);
        return new HostedPayment(checkout.provider(), checkout.launchValue());
    }

    @PostMapping("/api/v1/reservations/{id}/payment-session")
    ResponseEntity<NativePayment> createNativePayment(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        var checkout = payments.open(id, userId, Channel.NATIVE);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new NativePayment(checkout.provider(), checkout.launchValue(), checkout.amountInMinorUnits()));
    }

    @PostMapping("/api/v1/reservations/{id}/payment-session/status")
    ReservationResponse checkPayment(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        return ReservationMapper.toResponse(payments.check(id, userId));
    }

    @PostMapping("/api/v1/payments/{provider}/webhook")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void webhook(@PathVariable String provider, @RequestBody String payload, @RequestHeader HttpHeaders headers) {
        payments.acceptWebhook(provider, payload, headers);
    }

    record HostedPayment(String provider, String url) {}
    record NativePayment(String provider, String credential, long amountInMinorUnits) {}
}
