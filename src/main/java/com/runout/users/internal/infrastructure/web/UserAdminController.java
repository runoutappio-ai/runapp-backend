package com.runout.users.internal.infrastructure.web;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserRole;
import com.runout.users.api.UserService;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.web.dto.request.CreateStaffUserRequest;
import com.runout.users.internal.infrastructure.web.dto.request.UpdateUserRoleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
class UserAdminController {

    private final UserService users;

    @GetMapping("/api/admin/users")
    List<UserSummary> findUsers() {
        log.info("Admin listing users");
        return users.findAll();
    }

    @PostMapping("/api/admin/users")
    UserSummary createStaffUser(@Valid @RequestBody CreateStaffUserRequest request) {
        var role = UserRole.from(request.role());
        log.info("Super admin creating staff user email={} role={}", request.email(), role);
        return users.createStaff(RegisterUserCommand.builder()
                .displayName(request.displayName())
                .email(request.email())
                .password(request.password())
                .build(), role);
    }

    @PatchMapping("/api/admin/users/{id}/role")
    UserSummary updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateUserRoleRequest request) {
        log.info("Super admin updating user role userId={} role={}", id, request.role());
        return users.updateRole(id, request.role());
    }
}
