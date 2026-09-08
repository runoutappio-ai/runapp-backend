package com.runout.users.internal.application;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserSummary;
import com.runout.users.api.Users;
import com.runout.users.internal.infrastructure.persistence.UserRepository;
import com.runout.users.internal.infrastructure.persistence.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class UserManagement implements Users {

    private final UserRepository repository;
    private final IdentityProviderRegistration identityProviderRegistration;

    @Override
    public UserSummary register(RegisterUserCommand command) {
        var email = command.email().strip().toLowerCase();

        if (repository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        var normalizedCommand = new RegisterUserCommand(
                command.displayName().strip(),
                email,
                command.password()
        );
        var identityProviderSubject = identityProviderRegistration.register(normalizedCommand);

        try {
            return toSummary(repository.saveAndFlush(new UserEntity(
                    identityProviderSubject,
                    normalizedCommand.displayName(),
                    normalizedCommand.email()
            )));
        } catch (RuntimeException error) {
            identityProviderRegistration.delete(identityProviderSubject);
            throw error;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummary requireActive(UUID id) {
        var user = repository.findById(id)
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active user not found: " + id));

        return toSummary(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummary requireActiveByIdentityProviderSubject(String identityProviderSubject) {
        var user = repository.findByIdentityProviderSubject(identityProviderSubject)
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active user not found for authenticated identity"));

        return toSummary(user);
    }

    private UserSummary toSummary(UserEntity user) {
        return new UserSummary(user.getId(), user.getDisplayName(), user.getEmail());
    }
}
