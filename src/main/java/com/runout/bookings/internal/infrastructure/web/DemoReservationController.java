package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.api.ReservationService;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationRevealResponse;
import com.runout.bookings.internal.infrastructure.web.mapper.ReservationMapper;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantMenuItemSummary;
import com.runout.restaurants.api.RestaurantService;
import com.runout.restaurants.api.RestaurantSummary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequestMapping("/api/v1/reservations")
@ConditionalOnExpression("""
        '${runout.demo.skip-wait-enabled:auto}' == 'true' or
        ('${runout.demo.skip-wait-enabled:auto}' == 'auto' and '${runout.payments.provider:mock}' == 'mock')
        """)
@Slf4j
class DemoReservationController {

    private static final Set<String> DEMO_REVEALABLE_STATUSES = Set.of(
            "PAID", "ASSIGNED", "IN_PROGRESS", "CONFIRMED", "COMPLETED"
    );
    private static final RestaurantSummary STRIPE_DEMO_RESTAURANT = RestaurantSummary.builder()
            .id(new UUID(0, 0))
            .name("Run Out Demo Restaurant")
            .active(true)
            .cuisine("Contemporary")
            .description("Sample restaurant for the reveal preview.")
            .cityName("Dubai")
            .build();

    private final ReservationService reservations;
    private final RestaurantService restaurants;
    private final boolean mockPayments;

    DemoReservationController(ReservationService reservations, RestaurantService restaurants,
                              @Value("${runout.payments.provider:mock}") String provider) {
        this.reservations = reservations;
        this.restaurants = restaurants;
        this.mockPayments = "mock".equals(provider);
    }

    @PostMapping("/{id}/demo-reveal")
    ReservationRevealResponse revealNow(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        var reservation = reservations.findByIdForUser(id, userId);
        if (!"CAPTURED".equals(reservation.paymentStatus()) || !DEMO_REVEALABLE_STATUSES.contains(reservation.status())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Complete the payment before previewing the envelope reveal."
            );
        }

        log.warn("Skipping reveal wait in demo mode for reservation id={} userId={}", id, userId);
        var response = ReservationRevealResponse.builder().available(true).status(reservation.status());
        var details = ReservationMapper.toResponse(reservation);
        if (!mockPayments) {
            return response
                    .reservation(details.toBuilder()
                            .restaurantId(null)
                            .externalReference(null)
                            .build())
                    .restaurant(STRIPE_DEMO_RESTAURANT)
                    .menu(demoMenu(reservation.partySize()))
                    .build();
        }
        var restaurant = reservation.restaurantId() == null
                ? restaurants.findAllActive().stream()
                        .filter(candidate -> !candidate.menus().isEmpty())
                        .findFirst()
                        .or(() -> restaurants.findAllActive().stream().findFirst())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Add and activate at least one restaurant to preview the demo reveal."
                        ))
                : restaurants.findById(reservation.restaurantId());
        var menu = restaurants.findMenu(restaurant.id());
        if (menu.isEmpty()) {
            menu = demoMenu(reservation.partySize());
        }
        return response
                .reservation(details)
                .restaurant(restaurant.publicView())
                .menu(menu)
                .build();
    }

    private List<RestaurantMenuSummary> demoMenu(int partySize) {
        return List.of(RestaurantMenuSummary.builder()
                .id(-1L)
                .partySize(partySize)
                .discountPercentage(20)
                .sections(Map.of(
                        "STARTERS", List.of(new RestaurantMenuItemSummary("Welcome bite", "A seasonal chef's welcome")),
                        "MAINS", List.of(new RestaurantMenuItemSummary("Mystery main", "The kitchen's signature plate")),
                        "DESSERTS", List.of(new RestaurantMenuItemSummary("Dessert", "A sweet finish selected for the table")),
                        "DRINKS", List.of(new RestaurantMenuItemSummary("House refreshment", "Selected for the table"))
                ))
                .build());
    }
}
