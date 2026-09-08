package com.runout.matching.internal.application;

import com.runout.experiences.api.Experiences;
import com.runout.matching.api.CreateGroupCommand;
import com.runout.matching.api.GroupFormed;
import com.runout.matching.api.Matching;
import com.runout.matching.internal.infrastructure.persistence.MatchGroupRepository;
import com.runout.matching.internal.infrastructure.persistence.entity.MatchGroupEntity;
import com.runout.users.api.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
@Service @Transactional @RequiredArgsConstructor
class MatchingManagement implements Matching {
    private final MatchGroupRepository repository; private final Experiences experiences; private final Users users; private final ApplicationEventPublisher events;
    public UUID createGroup(CreateGroupCommand command) {
        var experience=experiences.requirePublished(command.experienceId());
        if(command.participantIds().isEmpty() || command.participantIds().size() > experience.capacity()) throw new IllegalArgumentException("Invalid group size");
        command.participantIds().forEach(users::requireActive);
        var group = repository.save(new MatchGroupEntity(command.experienceId(), command.participantIds()));
        events.publishEvent(new GroupFormed(group.getId(), command.experienceId(), command.participantIds(), Instant.now()));
        return group.getId();
    }
}
