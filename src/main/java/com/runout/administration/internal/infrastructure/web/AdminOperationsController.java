package com.runout.administration.internal.infrastructure.web;

import com.runout.administration.internal.infrastructure.web.dto.request.CreateExperienceRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.CreateGroupRequest;
import com.runout.administration.internal.infrastructure.web.dto.request.RecordBookingRequest;
import com.runout.administration.internal.infrastructure.web.dto.response.IdResponse;
import com.runout.administration.internal.infrastructure.web.mapper.AdminOperationsMapper;
import com.runout.bookings.api.Bookings;
import com.runout.experiences.api.Experiences;
import com.runout.matching.api.Matching;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
class AdminOperationsController {

    private final Experiences experiences;
    private final Matching matching;
    private final Bookings bookings;

    @PostMapping("/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    IdResponse createExperience(@Valid @RequestBody CreateExperienceRequest request) {
        var id = experiences.create(AdminOperationsMapper.toCommand(request));
        return AdminOperationsMapper.toIdResponse(id);
    }

    @PostMapping("/experiences/{id}/publication")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void publish(@PathVariable UUID id) {
        experiences.publish(id);
    }

    @PostMapping("/groups")
    @ResponseStatus(HttpStatus.CREATED)
    IdResponse createGroup(@Valid @RequestBody CreateGroupRequest request) {
        var id = matching.createGroup(AdminOperationsMapper.toCommand(request));
        return AdminOperationsMapper.toIdResponse(id);
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    IdResponse recordBooking(@Valid @RequestBody RecordBookingRequest request) {
        var id = bookings.recordManualBooking(AdminOperationsMapper.toCommand(request));
        return AdminOperationsMapper.toIdResponse(id);
    }

    @PostMapping("/bookings/{id}/confirmation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void confirmBooking(@PathVariable UUID id) {
        bookings.confirm(id);
    }
}
