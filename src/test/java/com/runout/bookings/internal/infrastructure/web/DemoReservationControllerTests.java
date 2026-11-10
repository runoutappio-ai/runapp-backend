package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.api.ReservationService;
import com.runout.bookings.api.ReservationSummary;
import com.runout.restaurants.api.RestaurantService;
import org.junit.jupiter.api.Test;
import org.mockito.MockMakers;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.server.ResponseStatusException;

import java.util.Currency;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

class DemoReservationControllerTests {
    private final ReservationService reservations = mock(ReservationService.class,
            withSettings().mockMaker(MockMakers.PROXY));
    private final RestaurantService restaurants = mock(RestaurantService.class,
            withSettings().mockMaker(MockMakers.PROXY));

    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(DemoReservationController.class)
            .withBean(ReservationService.class, () -> reservations)
            .withBean(RestaurantService.class, () -> restaurants);

    @Test
    void stripePreviewRequiresAnExplicitOptIn() {
        context.withPropertyValues("runout.payments.provider=stripe")
                .run(app -> assertThat(app).doesNotHaveBean(DemoReservationController.class));
        context.withPropertyValues("runout.payments.provider=stripe", "runout.demo.skip-wait-enabled=true")
                .run(app -> assertThat(app).hasSingleBean(DemoReservationController.class));
        context.withPropertyValues("runout.payments.provider=mock")
                .run(app -> assertThat(app).hasSingleBean(DemoReservationController.class));
        context.withPropertyValues("runout.payments.provider=mock", "runout.demo.skip-wait-enabled=false")
                .run(app -> assertThat(app).doesNotHaveBean(DemoReservationController.class));
    }

    @Test
    void paidStripePreviewDoesNotRevealTheAssignedRestaurant() {
        var reservationId = UUID.randomUUID();
        var userId = UUID.randomUUID();
        var assignedRestaurant = UUID.randomUUID();
        when(reservations.findByIdForUser(reservationId, userId)).thenReturn(ReservationSummary.builder()
                .id(reservationId).status("CONFIRMED").paymentStatus("CAPTURED")
                .currency(Currency.getInstance("AED")).excludedCuisineTypes(List.of())
                .restaurantId(assignedRestaurant).externalReference("private-reference").partySize(4)
                .build());

        var preview = new DemoReservationController(reservations, restaurants, "stripe")
                .revealNow(userId, reservationId);

        assertThat(preview.available()).isTrue();
        assertThat(preview.restaurant().id()).isNotEqualTo(assignedRestaurant);
        assertThat(preview.reservation().restaurantId()).isNull();
        assertThat(preview.reservation().externalReference()).isNull();
        assertThat(preview.menu()).singleElement().satisfies(menu -> assertThat(menu.partySize()).isEqualTo(4));
        verifyNoInteractions(restaurants);
    }

    @Test
    void aPendingStripePaymentCannotPreviewTheReveal() {
        var reservationId = UUID.randomUUID();
        var userId = UUID.randomUUID();
        when(reservations.findByIdForUser(reservationId, userId)).thenReturn(ReservationSummary.builder()
                .id(reservationId).status("PAYMENT_PENDING").paymentStatus("PAYMENT_PENDING")
                .excludedCuisineTypes(List.of()).build());

        assertThatThrownBy(() -> new DemoReservationController(reservations, restaurants, "stripe")
                .revealNow(userId, reservationId))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode().value()).isEqualTo(409));
        verifyNoInteractions(restaurants);
    }
}
