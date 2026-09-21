package com.runout.bookings.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.hibernate.validator.constraints.Length;

@Builder
public record PayReservationRequest(
        @NotBlank @Length(max = 255) String paymentMethodToken
) {
}
