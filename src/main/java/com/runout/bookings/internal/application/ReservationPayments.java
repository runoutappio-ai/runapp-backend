package com.runout.bookings.internal.application;

import com.runout.bookings.api.ReservationSummary;
import com.runout.bookings.internal.domain.ReservationStatus;
import com.runout.bookings.internal.infrastructure.persistence.ReservationRepository;
import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.payments.api.CheckoutGateway;
import com.runout.payments.api.CheckoutGateway.Channel;
import com.runout.payments.api.CheckoutGateway.State;
import com.runout.users.api.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReservationPayments {
    private final Map<String, CheckoutGateway> gateways;
    private final String activeProvider;
    private final ReservationRepository reservations;
    private final UserService users;

    ReservationPayments(List<CheckoutGateway> gateways,
                        @Value("${runout.payments.provider:mock}") String activeProvider,
                        ReservationRepository reservations, UserService users) {
        this.gateways = gateways.stream().collect(Collectors.toUnmodifiableMap(CheckoutGateway::provider, Function.identity()));
        this.activeProvider = activeProvider;
        this.reservations = reservations;
        this.users = users;
    }

    @Transactional
    public Checkout open(UUID reservationId, UUID userId, Channel channel) {
        var gateway = gateway(activeProvider, HttpStatus.NOT_FOUND);
        var reservation = lockForUser(reservationId, userId);
        var charge = pendingCharge(reservation);
        if (reservation.getCheckoutProvider() != null && !activeProvider.equals(reservation.getCheckoutProvider())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This reservation already uses another payment provider");
        }

        var other = channel == Channel.HOSTED ? Channel.NATIVE : Channel.HOSTED;
        closeAttempt(gateway, other, attemptId(reservation, other));
        String previousId = attemptId(reservation, channel);
        if (previousId != null) {
            var previous = gateway.retrieve(channel, previousId);
            if (previous.ready()) return new Checkout(activeProvider, previous.launchValue(), charge.amountInMinorUnits());
            if (previous.state() != State.CLOSED) throw paymentInProgress();
        }

        var attempt = gateway.start(channel, charge, previousId);
        if (attempt.state() == State.CLOSED) attempt = gateway.start(channel, charge, attempt.id());
        if (!attempt.ready()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The payment session is not ready");
        }
        switch (channel) {
            case HOSTED -> reservation.linkHostedPayment(activeProvider, attempt.id());
            case NATIVE -> reservation.linkNativePayment(activeProvider, attempt.id());
        }
        return new Checkout(activeProvider, attempt.launchValue(), charge.amountInMinorUnits());
    }

    @Transactional
    public ReservationSummary check(UUID reservationId, UUID userId) {
        var reservation = lockForUser(reservationId, userId);
        String provider = reservation.getCheckoutProvider();
        if (reservation.getStatus() == ReservationStatus.PAYMENT_PENDING && provider != null) {
            var gateway = gateway(provider, HttpStatus.CONFLICT);
            reconcile(reservation, gateway, Channel.NATIVE);
            reconcile(reservation, gateway, Channel.HOSTED);
        }
        return ReservationApplicationMapper.toSummary(reservation);
    }

    @Transactional
    public void acceptWebhook(String provider, String payload, HttpHeaders headers) {
        gateway(provider, HttpStatus.NOT_FOUND).verifyPaidEvent(payload, headers).ifPresent(payment -> {
            if (payment.reservationId() != null) {
                reservations.lockById(payment.reservationId())
                        .ifPresent(reservation -> applyPaidPayment(reservation, provider, payment));
            }
        });
    }

    void closePendingAttempts(ReservationEntity reservation) {
        String provider = reservation.getCheckoutProvider();
        if (provider == null) return;
        if (reservation.getStatus() != ReservationStatus.PAYMENT_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contact Run Out to cancel a reservation paid online");
        }
        var gateway = gateway(provider, HttpStatus.CONFLICT);
        closeAttempt(gateway, Channel.HOSTED, reservation.getHostedPaymentId());
        closeAttempt(gateway, Channel.NATIVE, reservation.getNativePaymentId());
    }

    private void reconcile(ReservationEntity reservation, CheckoutGateway gateway, Channel channel) {
        String id = attemptId(reservation, channel);
        if (reservation.getStatus() != ReservationStatus.PAYMENT_PENDING || id == null) return;
        var payment = gateway.retrieve(channel, id).payment();
        if (payment != null) applyPaidPayment(reservation, gateway.provider(), payment);
    }

    private CheckoutGateway gateway(String provider, HttpStatus missingStatus) {
        var gateway = gateways.get(provider);
        if (gateway == null) throw new ResponseStatusException(missingStatus, "Checkout provider is unavailable");
        return gateway;
    }

    private ReservationEntity lockForUser(UUID reservationId, UUID userId) {
        users.findByUserId(userId);
        return reservations.lockForUser(reservationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
    }

    private CheckoutGateway.Charge pendingCharge(ReservationEntity reservation) {
        if (reservation.getStatus() != ReservationStatus.PAYMENT_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This reservation is no longer awaiting payment");
        }
        long amount = feeInFils(reservation);
        if (amount <= 0 || !"AED".equals(reservation.getCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checkout requires a positive AED reservation fee");
        }
        var perGuest = reservation.getTotalBudget().divide(BigDecimal.valueOf(reservation.getPartySize()), 2, RoundingMode.HALF_UP);
        if (perGuest.compareTo(reservation.getBudgetPerPerson()) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The table and per-person budgets do not agree");
        }
        return new CheckoutGateway.Charge(reservation.getId(), amount, reservation.getCurrency());
    }

    private static String attemptId(ReservationEntity reservation, Channel channel) {
        return switch (channel) {
            case HOSTED -> reservation.getHostedPaymentId();
            case NATIVE -> reservation.getNativePaymentId();
        };
    }

    private void closeAttempt(CheckoutGateway gateway, Channel channel, String id) {
        if (id == null) return;
        var attempt = gateway.retrieve(channel, id);
        if (attempt.state() == State.READY) attempt = gateway.close(channel, id);
        if (attempt.state() != State.CLOSED) throw paymentInProgress();
    }

    private ResponseStatusException paymentInProgress() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "The payment provider is confirming this payment");
    }

    static void applyPaidPayment(ReservationEntity reservation, String provider, CheckoutGateway.PaidPayment payment) {
        if (!provider.equals(reservation.getCheckoutProvider()) || !reservation.getId().equals(payment.reservationId())) return;
        if (!payment.id().equals(reservation.getHostedPaymentId()) && !payment.id().equals(reservation.getNativePaymentId())) return;
        if (reservation.getStatus() != ReservationStatus.PAYMENT_PENDING) return;
        if (!reservation.getCurrency().equalsIgnoreCase(payment.currency())
                || payment.amountInMinorUnits() == null || payment.amountInMinorUnits() != feeInFils(reservation)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment does not match the saved reservation fee");
        }
        reservation.markPaid(payment.id(), "CAPTURED");
    }

    private static long feeInFils(ReservationEntity reservation) {
        return ReservationApplicationMapper.reservationFee(reservation).movePointRight(2).longValueExact();
    }

    public record Checkout(String provider, String launchValue, long amountInMinorUnits) {}
}
