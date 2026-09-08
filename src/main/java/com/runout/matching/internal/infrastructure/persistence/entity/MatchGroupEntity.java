package com.runout.matching.internal.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "match_group")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchGroupEntity {

    @Id
    private UUID id;
    private UUID experienceId;

    @ElementCollection
    @CollectionTable(name = "match_group_participant", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "user_id")
    private Set<UUID> participantIds = new HashSet<>();

    public MatchGroupEntity(UUID experienceId, Collection<UUID> users) {
        this.id = UUID.randomUUID();
        this.experienceId = experienceId;
        this.participantIds.addAll(users);
    }
}
