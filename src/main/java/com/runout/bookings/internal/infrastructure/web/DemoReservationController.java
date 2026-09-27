package com.runout.bookings.internal.infrastructure.web;

import com.runout.bookings.api.ReservationService;
import com.runout.bookings.internal.infrastructure.web.dto.response.ReservationRevealResponse;
import com.runout.bookings.internal.infrastructure.web.mapper.ReservationMapper;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@ConditionalOnExpression("${runout.demo.skip-wait-enabled:false} and '${runout.payments.provider:mock}' == 'mock'")
@RequiredArgsConstructor
@Slf4j
class DemoReservationController {

    private static final Set<String> DEMO_REVEALABLE_STATUSES = Set.of(
            "PAID", "ASSIGNED", "IN_PROGRESS", "CONFIRMED", "COMPLETED"
    );

    private final ReservationService reservations;
    private final RestaurantService restaurants;

    @PostMapping("/{id}/demo-reveal")
    ReservationRevealResponse revealNow(@RequestHeader(USER_ID) UUID userId, @PathVariable UUID id) {
        var reservation = reservations.findByIdForUser(id, userId);
        if (!DEMO_REVEALABLE_STATUSES.contains(reservation.status())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Complete the demo payment before previewing the envelope reveal."
            );
        }

        log.warn("Skipping reveal wait in demo mode for reservation id={} userId={}", id, userId);
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
            menu = demoMenu();
        }
        return ReservationRevealResponse.builder()
                .available(true)
                .status(reservation.status())
                .reservation(ReservationMapper.toResponse(reservation))
                .restaurant(restaurant)
                .menu(menu)
                .build();
    }

    private List<RestaurantMenuSummary> demoMenu() {
        return List.of(RestaurantMenuSummary.builder()
                .id(-1L)
                .entries(Map.of(
                        "Welcome bite", "A seasonal chef's welcome",
                        "Mystery main", "The kitchen's signature plate",
                        "Dessert", "A sweet finish selected for the table"
                ))
                .build());
    }
}
