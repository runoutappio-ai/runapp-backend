package com.runout.bookings.internal.application;

import com.runout.matching.api.GroupFormed;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class GroupFormedListener {
    private static final Logger log = LoggerFactory.getLogger(GroupFormedListener.class);

    @ApplicationModuleListener
    void on(GroupFormed event) {
        log.info("Group {} is ready for a manual restaurant booking", event.groupId());
    }
}
