package com.runout.users.internal.infrastructure.web.dto.response;

import com.runout.users.api.UserProfile;
import lombok.Builder;

@Builder
public record UserProfileResponse(UserProfile profile) {
}
