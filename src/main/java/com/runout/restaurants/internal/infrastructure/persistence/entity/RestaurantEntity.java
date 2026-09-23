package com.runout.restaurants.internal.infrastructure.persistence.entity;

import com.runout.restaurants.api.RestaurantMenuSummary;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "restaurant")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RestaurantEntity {

    @Id
    private UUID id;
    private String name;
    private String phone;
    private boolean active;
    private String cuisine;
    private Integer priceTier;
    private String description;
    private String openingHours;
    private String tags;
    private String googlePlaceId;
    private String formattedAddress;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private CityEntity city;
    private String area;
    private Double latitude;
    private Double longitude;
    private Double rating;
    private Integer userRatingCount;
    private String websiteUri;
    private String googleMapsUri;
    private String primaryType;
    private String types;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<RestaurantMenuSummary> menus;

    @Builder
    public RestaurantEntity(String name,
                            String phone,
                            String cuisine,
                            Integer priceTier,
                            String description,
                            String openingHours,
                            List<String> tags,
                            String googlePlaceId,
                            String formattedAddress,
                            CityEntity city,
                            String area,
                            Double latitude,
                            Double longitude,
                            Double rating,
                            Integer userRatingCount,
                            String websiteUri,
                            String googleMapsUri,
                            String primaryType,
                            List<String> types,
                            List<RestaurantMenuSummary> menus) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.phone = phone;
        this.active = true;
        this.cuisine = cuisine;
        this.priceTier = priceTier;
        this.description = description;
        this.openingHours = openingHours;
        this.tags = join(tags);
        this.menus = copyMenus(menus);
        updateGoogleMetadata(googlePlaceId, formattedAddress, city, area, latitude, longitude, rating, userRatingCount, websiteUri,
                googleMapsUri, primaryType, types);
    }

    public void update(String name,
                       String phone,
                       String cuisine,
                       Integer priceTier,
                       String description,
                       String openingHours,
                       List<String> tags,
                       String googlePlaceId,
                       String formattedAddress,
                       CityEntity city,
                       String area,
                       Double latitude,
                       Double longitude,
                       Double rating,
                       Integer userRatingCount,
                       String websiteUri,
                       String googleMapsUri,
                       String primaryType,
                       List<String> types,
                       List<RestaurantMenuSummary> menus) {
        this.name = name;
        this.phone = phone;
        this.cuisine = cuisine;
        this.priceTier = priceTier;
        this.description = description;
        this.openingHours = openingHours;
        this.tags = join(tags);
        this.menus = copyMenus(menus);
        updateGoogleMetadata(googlePlaceId, formattedAddress, city, area, latitude, longitude, rating, userRatingCount, websiteUri,
                googleMapsUri, primaryType, types);
    }

    public void activate() {
        active = true;
    }

    public void deactivate() {
        active = false;
    }

    public List<String> getTypes() {
        return split(types);
    }

    public List<String> getTags() {
        return split(tags);
    }

    public List<RestaurantMenuSummary> getMenus() {
        return copyMenus(menus);
    }

    private void updateGoogleMetadata(String googlePlaceId,
                                      String formattedAddress,
                                      CityEntity city,
                                      String area,
                                      Double latitude,
                                      Double longitude,
                                      Double rating,
                                      Integer userRatingCount,
                                      String websiteUri,
                                      String googleMapsUri,
                                      String primaryType,
                                      List<String> types) {
        this.googlePlaceId = googlePlaceId;
        this.formattedAddress = formattedAddress;
        this.city = city;
        this.area = area;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rating = rating;
        this.userRatingCount = userRatingCount;
        this.websiteUri = websiteUri;
        this.googleMapsUri = googleMapsUri;
        this.primaryType = primaryType;
        this.types = join(types);
    }

    private String join(List<String> values) {
        return values == null || values.isEmpty() ? null : String.join(",", values);
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(","));
    }

    private List<RestaurantMenuSummary> copyMenus(List<RestaurantMenuSummary> menus) {
        return menus == null ? List.of() : List.copyOf(menus);
    }
}
