package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "runout.payments.provider", havingValue = "stripe")
class StripeReservationController {
    private final ReservationPaymentController payments;

    @PostMapping("/api/v1/reservations/{id}/stripe-checkout")
    CheckoutResponse createCheckout(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        return new CheckoutResponse(payments.createCheckout(userId, id).url());
    }

    @PostMapping("/api/v1/reservations/{id}/stripe-payment")
    ResponseEntity<NativePaymentResponse> createNativePayment(
            @RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        var response = payments.createNativePayment(userId, id);
        var payment = response.getBody();
        return ResponseEntity.ok().headers(response.getHeaders())
                .body(new NativePaymentResponse(payment.credential(), payment.amountInMinorUnits()));
    }

    @PostMapping("/api/v1/reservations/{id}/stripe-payment/status")
    ReservationResponse checkNativePayment(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        return payments.checkPayment(userId, id);
    }

    @PostMapping("/api/v1/stripe/webhook")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void webhook(@RequestBody String payload, @RequestHeader HttpHeaders headers) {
        payments.webhook("stripe", payload, headers);
    }

    @GetMapping(value = "/api/v1/stripe/return", produces = MediaType.TEXT_HTML_VALUE)
    String returnToApp() {
        return """
                <!doctype html><html lang="en"><head><meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Return to Run Out</title></head><body>
                <main><h1>Return to Run Out</h1>
                <p>Close this page and return to the app to check your reservation payment.</p></main>
                </body></html>
                """;
    }

    record CheckoutResponse(String url) {}
    record NativePaymentResponse(String clientSecret, long amountInFils) {}
}
