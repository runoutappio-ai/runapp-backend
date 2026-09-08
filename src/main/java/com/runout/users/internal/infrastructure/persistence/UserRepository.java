package com.runout.users.internal.infrastructure.persistence;

import com.runout.users.internal.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<UserEntity> findByIdentityProviderSubject(String identityProviderSubject);
}
