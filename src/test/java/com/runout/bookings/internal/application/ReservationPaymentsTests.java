package com.runout.bookings.internal.application;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.internal.domain.ReservationStatus;
import com.runout.bookings.internal.infrastructure.persistence.ReservationRepository;
import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.payments.api.CheckoutGateway;
import com.runout.users.api.UserService;
import org.junit.jupiter.api.Test;

import static com.runout.payments.api.CheckoutGateway.Channel.HOSTED;
import static com.runout.payments.api.CheckoutGateway.Channel.NATIVE;
import static com.runout.payments.api.CheckoutGateway.State.*;
import org.mockito.MockMakers;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReservationPaymentsTests {
    @Test
    void marksOnlyTheLinkedPaidSessionAndAcceptsRedelivery() {
        var reservation = pendingReservation();
        ReservationPayments.applyPaidPayment(reservation, "test-gateway", payment(reservation, "cs_test_other", 6000L, "aed"));
        ReservationPayments.applyPaidPayment(reservation, "other-gateway", payment(reservation, "cs_test_linked", 6000L, "aed"));
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PAYMENT_PENDING);

        var paid = payment(reservation, "cs_test_linked", 6000L, "aed");
        ReservationPayments.applyPaidPayment(reservation, "test-gateway", paid);
        ReservationPayments.applyPaidPayment(reservation, "test-gateway", paid);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PAID);
        assertThat(reservation.getPaymentReference()).isEqualTo("cs_test_linked");
    }

    @Test
    void rejectsTheWrongCurrencyOrAmountEvenForTheLinkedSession() {
        var reservation = pendingReservation();
        assertThatThrownBy(() -> ReservationPayments.applyPaidPayment(
                reservation, "test-gateway", payment(reservation, "cs_test_linked", 60_000L, "aed")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> ReservationPayments.applyPaidPayment(
                reservation, "test-gateway", payment(reservation, "cs_test_linked", 6000L, "usd")))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PAYMENT_PENDING);
    }

    @Test
    void switchesFromHostedCheckoutOnceAndReusesTheIntentForEitherNativeButton() {
        var reservation = pendingReservation();
        var gateway = mock(CheckoutGateway.class, withSettings().mockMaker(MockMakers.PROXY));
        var service = service(gateway, reservation);
        var open = new CheckoutGateway.Attempt("cs_test_linked", READY, "https://example.test", null);
        var expired = new CheckoutGateway.Attempt("cs_test_linked", CLOSED, null, null);
        var charge = new CheckoutGateway.Charge(reservation.getId(), 6000L, "AED");
        var intent = new CheckoutGateway.Attempt("pi_linked", READY, "test_client_secret", null);
        when(gateway.retrieve(HOSTED, "cs_test_linked")).thenReturn(open, expired);
        when(gateway.close(HOSTED, "cs_test_linked")).thenReturn(expired);
        when(gateway.start(NATIVE, charge, null)).thenReturn(intent);
        when(gateway.retrieve(NATIVE, "pi_linked")).thenReturn(intent);

        assertThat(service.open(reservation.getId(), reservation.getUserId(), NATIVE))
                .isEqualTo(service.open(reservation.getId(), reservation.getUserId(), NATIVE));
        var order = inOrder(gateway);
        order.verify(gateway).close(HOSTED, "cs_test_linked");
        order.verify(gateway).start(NATIVE, charge, null);
        order.verify(gateway).retrieve(NATIVE, "pi_linked");
        verify(gateway, times(1)).start(any(), any(), any());
        assertThat(reservation.getNativePaymentId()).isEqualTo("pi_linked");
    }

    @Test
    void refusesToOpenHostedCheckoutWhenTheNativePaymentAlreadySucceeded() {
        var reservation = pendingReservation();
        reservation.linkNativePayment("test-gateway", "pi_linked");
        var gateway = mock(CheckoutGateway.class, withSettings().mockMaker(MockMakers.PROXY));
        var service = service(gateway, reservation);
        when(gateway.retrieve(NATIVE, "pi_linked")).thenReturn(new CheckoutGateway.Attempt(
                "pi_linked", PAID, null, payment(reservation, "pi_linked", 6000L, "aed")));

        assertThatThrownBy(() -> service.open(reservation.getId(), reservation.getUserId(), HOSTED))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("The payment provider is confirming this payment");
        verify(gateway, never()).start(any(), any(), any());

        assertThat(service.check(reservation.getId(), reservation.getUserId()).status())
                .isEqualTo("PAID");
        assertThat(reservation.getPaymentReference()).isEqualTo("pi_linked");
    }

    private ReservationPayments service(CheckoutGateway gateway, ReservationEntity reservation) {
        return service(gateway, reservation, "test-gateway");
    }

    @Test
    void refusesToOpenAnotherProviderForAReservationWithAnExistingAttempt() {
        var reservation = pendingReservation();
        var gateway = mock(CheckoutGateway.class, withSettings().mockMaker(MockMakers.PROXY));
        var service = service(gateway, reservation, "new-gateway");

        assertThatThrownBy(() -> service.open(reservation.getId(), reservation.getUserId(), NATIVE))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already uses another payment provider");
        verify(gateway, never()).start(any(), any(), any());
    }

    private ReservationPayments service(CheckoutGateway gateway, ReservationEntity reservation, String activeProvider) {
        var reservations = mock(ReservationRepository.class, withSettings().mockMaker(MockMakers.PROXY));
        when(reservations.lockForUser(reservation.getId(), reservation.getUserId())).thenReturn(Optional.of(reservation));
        var users = mock(UserService.class, withSettings().mockMaker(MockMakers.PROXY));
        when(gateway.provider()).thenReturn(activeProvider);
        return new ReservationPayments(List.of(gateway), activeProvider, reservations, users);
    }

    private ReservationEntity pendingReservation() {
        var reservation = ReservationApplicationMapper.toReservationEntity(UUID.randomUUID(), CreateReservationCommand.builder()
                .partySize(4)
                .budgetPerPerson(BigDecimal.valueOf(150))
                .currency(Currency.getInstance("AED"))
                .excludedCuisineTypes(List.of())
                .build());
        reservation.linkHostedPayment("test-gateway", "cs_test_linked");
        return reservation;
    }

    private CheckoutGateway.PaidPayment payment(ReservationEntity reservation, String id, long amount, String currency) {
        return new CheckoutGateway.PaidPayment(id, amount, currency, reservation.getId());
    }
}
