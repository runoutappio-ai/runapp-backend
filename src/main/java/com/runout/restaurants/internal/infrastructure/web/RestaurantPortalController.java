package com.runout.restaurants.internal.infrastructure.web;

import com.runout.restaurants.api.RestaurantMenuItemSummary;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantService;
import com.runout.restaurants.api.RestaurantSummary;
import com.runout.restaurants.api.UpdateRestaurantPortalCommand;
import com.runout.restaurants.internal.infrastructure.web.dto.request.UpdateRestaurantMenusRequest;
import com.runout.restaurants.internal.infrastructure.web.dto.request.UpdateRestaurantPortalRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/restaurant-portal/me")
@PreAuthorize("hasRole('RESTAURANT')")
class RestaurantPortalController {

    private final RestaurantService restaurants;

    @org.springframework.web.bind.annotation.PostMapping("/menus/cancel-submission")
    RestaurantSummary cancelSubmission(@RequestHeader(USER_ID) UUID ownerUserId) {
        return restaurants.cancelMenuSubmission(ownerUserId);
    }

    @GetMapping
    RestaurantSummary getRestaurant(@RequestHeader(USER_ID) UUID ownerUserId) {
        return restaurants.findByOwnerUserId(ownerUserId);
    }

    @PatchMapping
    RestaurantSummary updateRestaurant(@RequestHeader(USER_ID) UUID ownerUserId,
                                       @Valid @RequestBody UpdateRestaurantPortalRequest request) {
        return restaurants.updatePortal(UpdateRestaurantPortalCommand.builder()
                .ownerUserId(ownerUserId)
                .name(request.name())
                .phone(request.phone())
                .description(request.description())
                .openingHours(request.openingHours())
                .formattedAddress(request.formattedAddress())
                .parkingInstructions(request.parkingInstructions())
                .area(request.area())
                .websiteUri(request.websiteUri())
                .priceTier(request.priceTier())
                .categories(request.categories())
                .build());
    }

    @PutMapping("/menus")
    RestaurantSummary updateMenus(@RequestHeader(USER_ID) UUID ownerUserId,
                                  @Valid @RequestBody UpdateRestaurantMenusRequest request) {
        var menus = request.menus().stream()
                .map(menu -> RestaurantMenuSummary.builder()
                        .id(menu.id() == null ? menu.partySize().longValue() : menu.id())
                        .partySize(menu.partySize())
                        .priceBeforePerPerson(menu.priceBeforePerPerson())
                        .priceAfterPerPerson(menu.priceAfterPerPerson())
                        .discountPercentage(menu.discountPercentage())
                        .sections(menu.sections().entrySet().stream().collect(Collectors.toMap(
                                Map.Entry::getKey,
                                entry -> entry.getValue().stream()
                                        .map(item -> new RestaurantMenuItemSummary(item.name().strip(), normalize(item.description())))
                                        .toList()
                        )))
                        .build())
                .toList();
        return restaurants.updatePortalMenus(ownerUserId, menus, request.priceTier());
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
