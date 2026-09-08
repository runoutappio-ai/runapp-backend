package com.runout.administration.internal.infrastructure.web.mapper;

import com.runout.administration.internal.infrastructure.web.dto.request.CreateExperienceRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.CreateGroupRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.RecordBookingRequest;
import com.runout.administration.internal.infrastructure.web.dto.response.IdResponse;
import com.runout.bookings.api.RecordManualBookingCommand;
import com.runout.experiences.api.CreateExperienceCommand;
import com.runout.matching.api.CreateGroupCommand;

import java.util.UUID;

public final class AdminOperationsMapper {

    private AdminOperationsMapper() {
    }

    public static CreateExperienceCommand toCommand(CreateExperienceRequest request) {
        return new CreateExperienceCommand(request.title(), request.startsAt(), request.capacity());
    }

    public static CreateGroupCommand toCommand(CreateGroupRequest request) {
        return new CreateGroupCommand(request.experienceId(), request.participantIds());
    }

    public static RecordManualBookingCommand toCommand(RecordBookingRequest request) {
        return new RecordManualBookingCommand(
                request.experienceId(),
                request.restaurantId(),
                request.groupId(),
                request.externalReference(),
                request.reservedAt()
        );
    }

    public static IdResponse toIdResponse(UUID id) {
        return new IdResponse(id);
    }
}
