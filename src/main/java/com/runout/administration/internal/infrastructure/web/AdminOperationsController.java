package com.runout.administration.internal.infrastructure.web;

import com.runout.administration.internal.infrastructure.web.dto.request.ConfirmReservationRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.AssignReservationRequest;
import com.runout.administration.internal.infrastructure.web.dto.response.AdminReservationResponse;
import com.runout.administration.internal.infrastructure.web.dto.response.IdResponse;
import com.runout.administration.internal.infrastructure.web.dto.response.NearbyRestaurantResponse;
import com.runout.administration.internal.infrastructure.web.mapper.AdminOperationsMapper;
import com.runout.bookings.api.ReservationService;
import com.runout.restaurants.api.RestaurantService;
import com.runout.users.api.UserRole;
import com.runout.users.api.UserService;
import com.runout.users.api.UserSummary;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
class AdminOperationsController {

    private final ReservationService reservations;
    private final RestaurantService restaurants;
    private final UserService users;

    @GetMapping("/employees")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    List<UserSummary> findReservationAssignees() {
        return users.findAllActiveByRole(UserRole.WORKER);
    }

    @GetMapping("/reservations")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    List<AdminReservationResponse> findReservations() {
        log.info("Admin listing reservations");
        return reservations.findAll().stream()
                .map(AdminOperationsMapper::toResponse)
                .toList();
    }

    @GetMapping("/my-reservations")
    @PreAuthorize("hasRole('WORKER')")
    List<AdminReservationResponse> findMyReservations(@RequestHeader(USER_ID) UUID employeeId) {
        log.info("Worker listing visible reservations employeeId={}", employeeId);
        return reservations.findAllForEmployee(employeeId).stream()
                .map(AdminOperationsMapper::toResponse)
                .toList();
    }

    @GetMapping("/reservations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    AdminReservationResponse findReservation(@PathVariable UUID id,
                                             @RequestHeader(USER_ID) UUID employeeId,
                                             Authentication authentication) {
        log.info("Admin retrieving reservation id={}", id);
        var reservation = reservations.findById(id);
        ensureWorkerCanAccessReservation(authentication, employeeId, reservation);
        return AdminOperationsMapper.toResponse(reservation);
    }

    @GetMapping("/reservations/{id}/nearby-restaurants")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    List<NearbyRestaurantResponse> findNearbyRestaurants(@PathVariable UUID id,
                                                          @RequestHeader(USER_ID) UUID employeeId,
                                                          Authentication authentication) {
        var reservation = reservations.findById(id);
        ensureWorkerCanAccessReservation(authentication, employeeId, reservation);

        return restaurants.findAllActive().stream()
                .filter(restaurant -> restaurant.latitude() != null && restaurant.longitude() != null)
                .map(restaurant -> toNearbyRestaurant(reservation, restaurant))
                .filter(restaurant -> restaurant.distanceMeters() <= reservation.radiusMeters())
                .sorted(java.util.Comparator.comparingInt(NearbyRestaurantResponse::distanceMeters))
                .toList();
    }

    @PostMapping("/reservations/{id}/confirmation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    @ResponseStatus(HttpStatus.CREATED)
    IdResponse confirmReservation(@PathVariable UUID id,
                                  @RequestHeader(USER_ID) UUID employeeId,
                                  Authentication authentication,
                                  @Valid @RequestBody ConfirmReservationRequest request) {
        log.info("Admin confirming reservation id={} restaurantId={}", id, request.restaurantId());
        ensureWorkerOwnsReservation(authentication, employeeId, id);
        var reservation = reservations.confirm(AdminOperationsMapper.toCommand(id, request));
        return AdminOperationsMapper.toIdResponse(reservation.id());
    }

    @PostMapping("/reservations/{id}/assignment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void assignReservation(@PathVariable UUID id,
                           @RequestHeader(USER_ID) UUID employeeId,
                           Authentication authentication,
                           @Valid @RequestBody AssignReservationRequest request) {
        log.info("Admin assigning reservation id={} employeeId={}", id, request.employeeId());
        var reservation = reservations.findById(id);
        ensureWorkerCanAccessReservation(authentication, employeeId, reservation);
        if (hasWorkerRole(authentication) && !employeeId.equals(request.employeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workers can only assign reservations to themselves");
        }
        var employee = users.requireActive(request.employeeId());
        if (!UserRole.WORKER.name().equals(employee.role())) {
            throw new IllegalArgumentException("Reservation assignee must be an active worker");
        }
        reservations.assignReservation(id, request.employeeId());
    }

    @PostMapping("/reservations/{id}/start")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void startReservation(@PathVariable UUID id,
                          @RequestHeader(USER_ID) UUID employeeId,
                          Authentication authentication) {
        log.info("Admin starting reservation id={}", id);
        ensureWorkerOwnsReservation(authentication, employeeId, id);
        reservations.startReservation(id);
    }

    @PostMapping("/reservations/{id}/rejection")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WORKER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void rejectReservation(@PathVariable UUID id,
                           @RequestHeader(USER_ID) UUID employeeId,
                           Authentication authentication) {
        log.info("Admin rejecting reservation id={}", id);
        ensureWorkerOwnsReservation(authentication, employeeId, id);
        reservations.rejectReservation(id);
    }

    @PostMapping("/reservations/{id}/delivery")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void sendReservationToUser(@PathVariable UUID id) {
        log.info("Admin delivering reservation id={}", id);
        reservations.sendReservationToUser(id);
    }

    @PostMapping("/reservations/{id}/completion")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void completeReservation(@PathVariable UUID id) {
        log.info("Admin completing reservation id={}", id);
        reservations.completeReservation(id);
    }

    private void ensureWorkerCanAccessReservation(Authentication authentication,
                                                  UUID employeeId,
                                                  com.runout.bookings.api.ReservationSummary reservation) {
        if (!hasWorkerRole(authentication)) {
            return;
        }

        var isOwnReservation = employeeId.equals(reservation.assignedEmployeeId());
        var isAvailableForAssignment = "PAID".equals(reservation.status()) && reservation.assignedEmployeeId() == null;
        if (!isOwnReservation && !isAvailableForAssignment) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
    }

    private void ensureWorkerOwnsReservation(Authentication authentication, UUID employeeId, UUID reservationId) {
        if (!hasWorkerRole(authentication)) {
            return;
        }

        var reservation = reservations.findById(reservationId);
        if (!employeeId.equals(reservation.assignedEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
    }

    private boolean hasWorkerRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_WORKER".equals(authority.getAuthority()));
    }

    private NearbyRestaurantResponse toNearbyRestaurant(com.runout.bookings.api.ReservationSummary reservation,
                                                        com.runout.restaurants.api.RestaurantSummary restaurant) {
        return NearbyRestaurantResponse.builder()
                .id(restaurant.id())
                .name(restaurant.name())
                .formattedAddress(restaurant.formattedAddress())
                .cuisine(restaurant.cuisine())
                .rating(restaurant.rating())
                .distanceMeters(distanceMeters(reservation.latitude().doubleValue(), reservation.longitude().doubleValue(),
                        restaurant.latitude(), restaurant.longitude()))
                .build();
    }

    private int distanceMeters(double originLatitude, double originLongitude, double destinationLatitude, double destinationLongitude) {
        var latitudeDelta = Math.toRadians(destinationLatitude - originLatitude);
        var longitudeDelta = Math.toRadians(destinationLongitude - originLongitude);
        var haversine = Math.pow(Math.sin(latitudeDelta / 2), 2)
                + Math.cos(Math.toRadians(originLatitude)) * Math.cos(Math.toRadians(destinationLatitude))
                * Math.pow(Math.sin(longitudeDelta / 2), 2);
        return (int) Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
    }
}
