package com.runout.payments.internal.infrastructure.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StripeCheckoutGatewayTests {
    @Test
    void rejectsWebhookWithAnInvalidSignature() {
        var checkout = new StripeCheckoutGateway("sk_test_placeholder", "whsec_placeholder",
                "http://localhost:8080/api/v1/stripe/return");
        var headers = new HttpHeaders();
        headers.set("Stripe-Signature", "t=12345,v1=forged");
        assertThatThrownBy(() -> checkout.verifyPaidEvent(
                "{\"type\":\"checkout.session.completed\",\"livemode\":false}",
                headers))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid Stripe webhook");
    }

    @Test
    void rejectsLiveCredentialsInTheSandboxIntegration() {
        assertThatThrownBy(() -> new StripeCheckoutGateway("sk_live_placeholder", "whsec_placeholder",
                "http://localhost:8080/api/v1/stripe/return"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("test-mode");
    }
}
