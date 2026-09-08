package com.runout.experiences.internal.infrastructure.persistence.entity;

import com.runout.experiences.internal.domain.ExperienceStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "experience")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceEntity {

    @Id
    private UUID id;
    private String title;
    private Instant startsAt;
    private int capacity;

    @Enumerated(EnumType.STRING)
    private ExperienceStatus status;

    public ExperienceEntity(String title, Instant startsAt, int capacity) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.startsAt = startsAt;
        this.capacity = capacity;
        this.status = ExperienceStatus.DRAFT;
    }

    public void publish() {
        if (status != ExperienceStatus.DRAFT) {
            throw new IllegalStateException("Only drafts can be published");
        }

        status = ExperienceStatus.PUBLISHED;
    }
}
