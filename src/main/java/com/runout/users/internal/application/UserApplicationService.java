package com.runout.users.internal.application;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserRole;
import com.runout.users.api.UserService;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.persistence.UserRepository;
import com.runout.users.internal.infrastructure.persistence.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class UserApplicationService implements UserService {

    private final UserRepository repository;
    private final IdentityProviderRegistration identityProviderRegistration;

    @Override
    @Transactional(readOnly = true)
    public List<UserSummary> findAll() {
        return repository.findAll().stream()
                .map(UserMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummary> findAllActiveByRole(UserRole role) {
        return repository.findAll().stream()
                .filter(UserEntity::isActive)
                .map(UserMapper::toDomain)
                .filter(user -> role.name().equals(user.role()))
                .toList();
    }

    @Override
    public UserSummary register(RegisterUserCommand command) {
        return register(command, UserRole.USER);
    }

    @Override
    public UserSummary createStaff(RegisterUserCommand command, UserRole role) {
        if (role != UserRole.MANAGER && role != UserRole.WORKER) {
            throw new IllegalArgumentException("Only manager or worker staff accounts can be created");
        }

        return register(command, role);
    }

    private UserSummary register(RegisterUserCommand command, UserRole role) {
        var normalizedCommand = UserMapper.normalize(command);

        if (repository.existsByEmailIgnoreCase(normalizedCommand.email())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        var id = identityProviderRegistration.register(normalizedCommand);

        try {
            var user = repository.saveAndFlush(UserMapper.toEntity(id, normalizedCommand));
            if (role != UserRole.USER) {
                identityProviderRegistration.updateRole(id, UserRole.USER.name(), role.name());
                user.updateRole(role.name());
            }
            return UserMapper.toDomain(user);
        } catch (RuntimeException error) {
            identityProviderRegistration.delete(id);
            throw error;
        }
    }

    @Override
    public UserSummary provisionAuthenticatedUser(UUID userId, String email, String displayName, String username) {
        return repository.findById(userId)
                .filter(UserEntity::isActive)
                .map(UserMapper::toDomain)
                .orElseGet(() -> createProvisionedUser(userId, email, displayName, username));
    }

    private UserSummary createProvisionedUser(UUID userId, String email, String displayName, String username) {
        var normalizedEmail = normalizeEmail(email);
        if (repository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("A user with this email already exists for another identity");
        }

        var resolvedDisplayName = resolveDisplayName(displayName, username, normalizedEmail);
        var user = UserEntity.builder()
                .id(userId)
                .displayName(resolvedDisplayName)
                .email(normalizedEmail)
                .build();
        return UserMapper.toDomain(repository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummary requireActive(UUID id) {
        var user = repository.findById(id)
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active user not found: " + id));

        return UserMapper.toDomain(user);
    }

    @Override
    public UserSummary findByUserId(UUID id) {
        return repository.findById(id)
                .filter(UserEntity::isActive)
                .map(UserMapper::toDomain)
                .orElseThrow(() -> new IllegalArgumentException("Active user not found for authenticated identity"));
    }

    @Override
    public UserSummary updateRole(UUID userId, String role) {
        var userRole = UserRole.from(role);
        if (userRole == UserRole.SUPER_ADMIN) {
            throw new IllegalArgumentException("SUPER_ADMIN cannot be assigned from the administration panel");
        }

        var user = repository.findById(userId).orElseThrow();
        var previousRole = user.getRole();
        identityProviderRegistration.updateRole(userId, previousRole, userRole.name());
        user.updateRole(userRole.name());
        return UserMapper.toDomain(user);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Authenticated identity does not contain an email");
        }
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private String resolveDisplayName(String displayName, String username, String email) {
        if (displayName != null && !displayName.isBlank()) {
            return displayName.strip();
        }
        if (username != null && !username.isBlank()) {
            return username.strip();
        }
        var emailSeparator = email.indexOf('@');
        return emailSeparator > 0 ? email.substring(0, emailSeparator) : email;
    }
}
