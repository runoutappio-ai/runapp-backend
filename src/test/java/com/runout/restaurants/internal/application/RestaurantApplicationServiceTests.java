package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.RestaurantMenuItemSummary;
import com.runout.restaurants.api.RestaurantMenuSummary;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RestaurantApplicationServiceTests {

    @Test
    void submissionsDoNotReplacePublishedMenusUntilApproved() {
        var original = List.of(menu(2));
        var submission = List.of(menu(2), menu(3), menu(4), menu(5), menu(6));
        var restaurant = com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity.builder()
                .name("Test").menus(original).build();
        restaurant.submitMenus(submission, 3);
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenuStatus()).isEqualTo("PENDING_APPROVAL");
        assertThatThrownBy(() -> restaurant.updateParkingInstructions("Changed parking"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("locked");
        assertThatThrownBy(() -> restaurant.submitMenus(original, 2))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("locked");
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenus()).isEqualTo(original);
        restaurant.cancelMenuSubmission();
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenuStatus()).isEqualTo("DRAFT");
        org.assertj.core.api.Assertions.assertThat(restaurant.getPendingMenus()).isEqualTo(submission);
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenus()).isEqualTo(original);
        assertThatCode(restaurant::requirePortalEditable).doesNotThrowAnyException();
        assertThatThrownBy(() -> restaurant.reviewMenus(true)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(restaurant::cancelMenuSubmission).isInstanceOf(IllegalArgumentException.class);
        restaurant.submitMenus(submission, 3);
        restaurant.reviewMenus(false);
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenuStatus()).isEqualTo("REJECTED");
        assertThatCode(() -> restaurant.updateParkingInstructions("Updated after rejection")).doesNotThrowAnyException();
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenus()).isEqualTo(original);
        restaurant.submitMenus(submission, 3);
        restaurant.reviewMenus(true);
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenuStatus()).isEqualTo("APPROVED");
        assertThatCode(restaurant::requirePortalEditable).doesNotThrowAnyException();
        org.assertj.core.api.Assertions.assertThat(restaurant.getMenus()).isEqualTo(submission);
        assertThatThrownBy(() -> restaurant.reviewMenus(true)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void emptyCoursePreventsSubmission() {
        var incomplete = RestaurantMenuSummary.builder().partySize(2)
                .priceBeforePerPerson(java.math.BigDecimal.valueOf(200))
                .priceAfterPerPerson(java.math.BigDecimal.valueOf(150))
                .sections(Map.of("STARTERS", List.of(), "MAINS", List.of(new RestaurantMenuItemSummary("Main", "")),
                        "DESSERTS", List.of(), "DRINKS", List.of())).build();
        assertThatThrownBy(() -> RestaurantApplicationService.validatePortalMenus(List.of(incomplete, menu(3), menu(4), menu(5), menu(6))))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Complete starters");
    }

    @Test
    void restaurantAccountCanPublishExactlyOneStructuredMenuForEveryPartySize() {
        assertThatCode(() -> RestaurantApplicationService.validatePortalMenus(
                List.of(menu(2), menu(3), menu(4), menu(5), menu(6))))
                .doesNotThrowAnyException();
    }

    @Test
    void restaurantAccountCannotPublishAnIncompleteSetOfMenus() {
        assertThatThrownBy(() -> RestaurantApplicationService.validatePortalMenus(List.of(menu(2), menu(3))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Exactly five menus");
    }

    private RestaurantMenuSummary menu(int partySize) {
        var dish = new RestaurantMenuItemSummary("Dish", "Description");
        return RestaurantMenuSummary.builder()
                .id((long) partySize)
                .partySize(partySize)
                .discountPercentage(20)
                .priceBeforePerPerson(java.math.BigDecimal.valueOf(200))
                .priceAfterPerPerson(java.math.BigDecimal.valueOf(160))
                .sections(Map.of(
                        "STARTERS", List.of(dish),
                        "MAINS", List.of(dish),
                        "DESSERTS", List.of(dish),
                        "DRINKS", List.of(dish)
                ))
                .build();
    }
}
