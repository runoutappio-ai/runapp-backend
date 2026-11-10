package com.runout.payments.internal.infrastructure.gateway;

import com.runout.payments.api.CheckoutGateway;
import com.stripe.StripeClient;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "runout.payments.provider", havingValue = "stripe")
class StripeCheckoutGateway implements CheckoutGateway {
    private final StripeClient stripe;
    private final String webhookSecret;
    private final String returnUrl;

    StripeCheckoutGateway(
            @Value("${runout.payments.stripe.secret-key}") String secretKey,
            @Value("${runout.payments.stripe.webhook-secret}") String webhookSecret,
            @Value("${runout.payments.stripe.return-url}") String returnUrl
    ) {
        if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
            throw new IllegalStateException("Stripe checkout requires a test-mode STRIPE_SECRET_KEY");
        }
        if (!webhookSecret.startsWith("whsec_")) {
            throw new IllegalStateException("Stripe checkout requires STRIPE_WEBHOOK_SECRET");
        }
        URI uri = URI.create(returnUrl);
        if (uri.getHost() == null || !("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
            throw new IllegalStateException("Set STRIPE_CHECKOUT_RETURN_URL to an HTTP(S) URL");
        }
        this.stripe = new StripeClient(secretKey);
        this.webhookSecret = webhookSecret;
        this.returnUrl = returnUrl;
    }

    @Override
    public String provider() {
        return "stripe";
    }

    @Override
    public Attempt start(Channel channel, Charge charge, String previousAttemptId) {
        return switch (channel) {
            case HOSTED -> createSession(charge, previousAttemptId);
            case NATIVE -> createIntent(charge, previousAttemptId);
        };
    }

    private Attempt createSession(Charge charge, String previousSessionId) {
        var price = SessionCreateParams.LineItem.PriceData.builder()
                .setCurrency(charge.currency().toLowerCase(Locale.ROOT))
                .setUnitAmount(charge.amountInMinorUnits())
                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName("Run Out reservation fee").build())
                .build();
        var params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setIntegrationIdentifier("runout-reservation-hqkzfjpw")
                .setWalletOptions(SessionCreateParams.WalletOptions.builder()
                        .setLink(SessionCreateParams.WalletOptions.Link.builder()
                                .setDisplay(SessionCreateParams.WalletOptions.Link.Display.NEVER).build())
                        .build())
                .setAdaptivePricing(SessionCreateParams.AdaptivePricing.builder().setEnabled(false).build())
                .setAutomaticTax(SessionCreateParams.AutomaticTax.builder().setEnabled(false).build())
                .setSuccessUrl(returnUrl)
                .setCancelUrl(returnUrl)
                .putMetadata("runout_reservation_id", charge.reservationId().toString())
                .addLineItem(SessionCreateParams.LineItem.builder().setQuantity(1L).setPriceData(price).build())
                .build();
        var request = RequestOptions.builder()
                .setIdempotencyKey("runout-checkout:" + charge.reservationId() + ":" + (previousSessionId == null ? "first" : previousSessionId))
                .build();
        try {
            return map(stripe.v1().checkout().sessions().create(params, request));
        } catch (StripeException error) {
            throw unavailable();
        }
    }

    @Override
    public Attempt retrieve(Channel channel, String attemptId) {
        try {
            return switch (channel) {
                case HOSTED -> map(stripe.v1().checkout().sessions().retrieve(attemptId));
                case NATIVE -> mapIntent(stripe.v1().paymentIntents().retrieve(attemptId));
            };
        } catch (StripeException error) {
            throw unavailable();
        }
    }

    @Override
    public Attempt close(Channel channel, String attemptId) {
        try {
            return switch (channel) {
                case HOSTED -> map(stripe.v1().checkout().sessions().expire(attemptId));
                case NATIVE -> mapIntent(stripe.v1().paymentIntents().cancel(attemptId));
            };
        } catch (StripeException error) {
            if (channel == Channel.NATIVE && "payment_intent_unexpected_state".equals(error.getCode())) {
                return retrieve(channel, attemptId);
            }
            throw unavailable();
        }
    }

    private Attempt createIntent(Charge charge, String previousIntentId) {
        var params = PaymentIntentCreateParams.builder()
                .setAmount(charge.amountInMinorUnits())
                .setCurrency(charge.currency().toLowerCase(Locale.ROOT))
                .addAllowedPaymentMethodType(PaymentIntentCreateParams.AllowedPaymentMethodType.CARD)
                .setDescription("Run Out reservation fee")
                .putMetadata("runout_reservation_id", charge.reservationId().toString())
                .build();
        var request = RequestOptions.builder()
                .setIdempotencyKey("runout-intent:" + charge.reservationId() + ":" + (previousIntentId == null ? "first" : previousIntentId))
                .build();
        try {
            return mapIntent(stripe.v1().paymentIntents().create(params, request));
        } catch (StripeException error) {
            throw unavailable();
        }
    }

    @Override
    public Optional<PaidPayment> verifyPaidEvent(String payload, HttpHeaders headers) {
        com.stripe.model.Event event;
        try {
            event = Webhook.constructEvent(payload, headers.getFirst("Stripe-Signature"), webhookSecret);
        } catch (SignatureVerificationException | RuntimeException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook");
        }
        if (Boolean.TRUE.equals(event.getLivemode())) return Optional.empty();
        boolean intentEvent = "payment_intent.succeeded".equals(event.getType());
        if (!intentEvent && !"checkout.session.completed".equals(event.getType())
                && !"checkout.session.async_payment_succeeded".equals(event.getType())) {
            return Optional.empty();
        }
        try {
            var object = event.getDataObjectDeserializer().deserializeUnsafe();
            if (intentEvent && object instanceof com.stripe.model.PaymentIntent intent) {
                if (reservationId(intent.getMetadata()) == null) return Optional.empty();
                return Optional.ofNullable(retrieve(Channel.NATIVE, intent.getId()).payment());
            }
            if (!intentEvent && object instanceof com.stripe.model.checkout.Session session) {
                if (reservationId(session.getMetadata()) == null) return Optional.empty();
                return Optional.ofNullable(retrieve(Channel.HOSTED, session.getId()).payment());
            }
            return Optional.empty();
        } catch (EventDataObjectDeserializationException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook");
        }
    }

    private Attempt mapIntent(com.stripe.model.PaymentIntent intent) {
        var state = switch (intent.getStatus()) {
            case "requires_payment_method", "requires_confirmation", "requires_action" -> State.READY;
            case "canceled" -> State.CLOSED;
            case "succeeded" -> State.PAID;
            default -> State.PROCESSING;
        };
        var payment = state == State.PAID ? new PaidPayment(intent.getId(), intent.getAmountReceived(),
                intent.getCurrency(), reservationId(intent.getMetadata())) : null;
        return new Attempt(intent.getId(), state, intent.getClientSecret(), payment);
    }

    private Attempt map(com.stripe.model.checkout.Session session) {
        var state = "paid".equals(session.getPaymentStatus()) ? State.PAID : switch (session.getStatus()) {
            case "open" -> State.READY;
            case "expired" -> State.CLOSED;
            default -> State.PROCESSING;
        };
        var payment = state == State.PAID ? new PaidPayment(session.getId(), session.getAmountTotal(),
                session.getCurrency(), reservationId(session.getMetadata())) : null;
        return new Attempt(session.getId(), state, session.getUrl(), payment);
    }

    private UUID reservationId(Map<String, String> metadata) {
        var reference = metadata == null ? null : metadata.get("runout_reservation_id");
        if (reference == null) return null;
        try {
            return UUID.fromString(reference);
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not complete the request with Stripe");
    }
}
