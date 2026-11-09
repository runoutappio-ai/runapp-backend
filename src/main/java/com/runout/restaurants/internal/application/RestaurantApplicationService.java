package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.*;
import com.runout.restaurants.internal.infrastructure.persistence.RestaurantRepository;
import com.runout.restaurants.internal.infrastructure.persistence.CityRepository;
import com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class RestaurantApplicationService implements RestaurantService {

    private static final Set<Integer> REQUIRED_PARTY_SIZES = Set.of(2, 3, 4, 5, 6);
    private static final Set<String> REQUIRED_MENU_SECTIONS = Set.of("STARTERS", "MAINS", "DESSERTS", "DRINKS");

    private final RestaurantRepository repository;
    private final CityRepository cities;
    private final GooglePlacesGateway googlePlaces;

    @Override
    public List<RestaurantSummary> findAll() {
        return repository.findAll()
                .stream()
                .map(RestaurantMapper::toSummary)
                .toList();
    }

    @Override
    public List<RestaurantSummary> findAllActive() {
        return repository.findAll()
                .stream()
                .filter(RestaurantEntity::isActive)
                .map(RestaurantMapper::toSummary)
                .map(RestaurantSummary::publicView)
                .toList();
    }

    @Override
    public RestaurantSummary findById(UUID restaurantId) {
        return RestaurantMapper.toSummary(repository.findById(restaurantId).orElseThrow());
    }

    @Override
    public RestaurantSummary findByOwnerUserId(UUID ownerUserId) {
        return RestaurantMapper.toSummary(repository.findByOwnerUserId(ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant portal is not linked to this account")));
    }

    @Override
    public RestaurantSummary requireActive(UUID id) {
        var restaurant = repository.findById(id)
                .filter(RestaurantEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active restaurant not found: " + id));

        return RestaurantMapper.toSummary(restaurant).publicView();
    }

    @Override
    public List<RestaurantMenuSummary> findMenu(UUID restaurantId) {
        return repository.findById(restaurantId).orElseThrow().getMenus();
    }

    @Override
    public List<GooglePlaceCandidate> searchGooglePlaces(SearchGooglePlacesCommand command) {
        return googlePlaces.search(command);
    }

    @Override
    @Transactional
    public RestaurantSummary importGooglePlace(GooglePlaceCandidate candidate) {
        var existing = repository.findByGooglePlaceId(candidate.googlePlaceId());
        var city = requireCity(candidate.cityId());
        if (existing.isPresent()) {
            var restaurant = existing.get();
            restaurant.update(candidate.name(), candidate.phone(), candidate.primaryType(), restaurant.getCategories(), restaurant.getPriceTier(),
                    restaurant.getDescription(), restaurant.getOpeningHours(), candidate.types(),
                    candidate.googlePlaceId(), candidate.formattedAddress(), city, candidate.area(),
                    candidate.latitude(), candidate.longitude(), candidate.rating(), candidate.userRatingCount(),
                    candidate.websiteUri(), candidate.googleMapsUri(), candidate.primaryType(), candidate.types(),
                    restaurant.getMenus());
            restaurant.activate();
            return RestaurantMapper.toSummary(restaurant);
        }

        var restaurant = repository.save(RestaurantMapper.toEntity(RestaurantMapper.toCreateCommand(candidate), city));
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary create(CreateRestaurantCommand command) {
        var restaurant = repository.save(RestaurantMapper.toEntity(command, requireCity(command.cityId())));
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary update(UpdateRestaurantCommand command) {
        var restaurant = repository.findById(command.id()).orElseThrow();
        var city = requireCity(command.cityId());
        restaurant.update(command.name(), command.phone(), command.cuisine(), command.categories(), command.priceTier(), command.description(),
                command.openingHours(), command.tags(), command.googlePlaceId(), command.formattedAddress(), city,
                command.area(),
                command.latitude(), command.longitude(), command.rating(), command.userRatingCount(),
                command.websiteUri(), command.googleMapsUri(), command.primaryType(), command.types(), command.menus());
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary updatePortal(UpdateRestaurantPortalCommand command) {
        if (command.categories().isEmpty()) {
            throw new IllegalArgumentException("Select at least one restaurant category");
        }
        if (command.priceTier() == null || command.priceTier() < 1 || command.priceTier() > 8) {
            throw new IllegalArgumentException("Select one valid price range");
        }
        var restaurant = repository.findByOwnerUserId(command.ownerUserId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant portal is not linked to this account"));
        restaurant.requirePortalEditable();
        restaurant.updatePortal(command.name(), command.phone(), command.description(), command.openingHours(),
                command.formattedAddress(), command.area(), command.websiteUri(), command.priceTier(), command.categories());
        restaurant.updateParkingInstructions(command.parkingInstructions());
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary updatePortalMenus(UUID ownerUserId, List<RestaurantMenuSummary> menus, Integer priceTier) {
        validatePortalMenus(menus);
        var restaurant = repository.findByOwnerUserId(ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant portal is not linked to this account"));
        if (priceTier == null || priceTier < 1 || priceTier > 8) throw new IllegalArgumentException("Select a price per person");
        if (restaurant.getName() == null || restaurant.getName().isBlank()
                || restaurant.getPhone() == null || restaurant.getPhone().isBlank()
                || restaurant.getFormattedAddress() == null || restaurant.getFormattedAddress().isBlank()
                || restaurant.getOpeningHours() == null || restaurant.getOpeningHours().isBlank()
                || restaurant.getArea() == null || restaurant.getArea().isBlank()
                || restaurant.getParkingInstructions() == null || restaurant.getParkingInstructions().isBlank()
                || restaurant.getCategories().isEmpty()) {
            throw new IllegalArgumentException("Complete and save restaurant details before submitting menus");
        }
        if ("PENDING_APPROVAL".equals(restaurant.getMenuStatus())) throw new IllegalArgumentException("Menus are already awaiting management approval");
        restaurant.submitMenus(menus, priceTier);
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary reviewMenus(UUID restaurantId, boolean approved) {
        var restaurant = repository.findById(restaurantId).orElseThrow();
        restaurant.reviewMenus(approved);
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary cancelMenuSubmission(UUID ownerUserId) {
        var restaurant = repository.findByOwnerUserId(ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant portal is not linked to this account"));
        restaurant.cancelMenuSubmission();
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary assignOwner(UUID restaurantId, UUID ownerUserId) {
        repository.findByOwnerUserId(ownerUserId).ifPresent(existing -> {
            if (!existing.getId().equals(restaurantId)) {
                throw new IllegalArgumentException("This account is already linked to another restaurant");
            }
        });
        var restaurant = repository.findById(restaurantId).orElseThrow();
        if (restaurant.getOwnerUserId() != null && !restaurant.getOwnerUserId().equals(ownerUserId)) {
            throw new IllegalArgumentException("This restaurant already has a portal account");
        }
        restaurant.assignOwner(ownerUserId);
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public void activate(UUID restaurantId) {
        var restaurant = repository.findById(restaurantId).orElseThrow();
        restaurant.activate();
    }

    @Override
    @Transactional
    public void deactivate(UUID restaurantId) {
        var restaurant = repository.findById(restaurantId).orElseThrow();
        restaurant.deactivate();
    }

    private com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity requireCity(UUID cityId) {
        return cities.findById(cityId)
                .filter(com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active city not found: " + cityId));
    }

    static void validatePortalMenus(List<RestaurantMenuSummary> menus) {
        if (menus == null || menus.size() != REQUIRED_PARTY_SIZES.size()) {
            throw new IllegalArgumentException("Exactly five menus are required: one for 2, 3, 4, 5 and 6 guests");
        }
        var partySizes = menus.stream().map(RestaurantMenuSummary::partySize).collect(java.util.stream.Collectors.toSet());
        if (!partySizes.equals(REQUIRED_PARTY_SIZES)) {
            throw new IllegalArgumentException("Menus must cover each party size from 2 to 6 exactly once");
        }
        for (var menu : menus) {
            if (menu.priceBeforePerPerson() == null || menu.priceAfterPerPerson() == null
                    || menu.priceBeforePerPerson().signum() <= 0 || menu.priceAfterPerPerson().signum() < 0
                    || menu.priceAfterPerPerson().compareTo(menu.priceBeforePerPerson()) > 0) {
                throw new IllegalArgumentException("Menu prices must be valid and the discounted price cannot exceed the original price");
            }
            if (menu.discountPercentage() == null || menu.discountPercentage() < 0 || menu.discountPercentage() > 100) {
                throw new IllegalArgumentException("Every menu discount must be between 0 and 100 percent");
            }
            if (!menu.sections().keySet().equals(REQUIRED_MENU_SECTIONS)) {
                throw new IllegalArgumentException("Every menu must contain starters, mains, desserts and drinks sections");
            }
            if (menu.sections().values().stream().anyMatch(java.util.Objects::isNull)) {
                throw new IllegalArgumentException("Menu sections cannot be null");
            }
            var hasDish = menu.sections().values().stream().flatMap(List::stream)
                    .anyMatch(item -> item.name() != null && !item.name().isBlank());
            if (!hasDish) {
                throw new IllegalArgumentException("Every menu must contain at least one item");
            }
            if (menu.sections().values().stream().anyMatch(List::isEmpty)
                    || menu.sections().values().stream().flatMap(List::stream).anyMatch(item -> item == null || item.name() == null || item.name().isBlank())) {
                throw new IllegalArgumentException("Complete starters, mains, desserts and drinks for every menu");
            }
        }
    }
}
