package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.LoginAttempt;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.domain.UserSession;
import com.privod.platform.modules.auth.repository.LoginAttemptRepository;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.repository.UserSessionRepository;
import com.privod.platform.modules.auth.web.dto.CreateAdminUserRequest;
import com.privod.platform.modules.auth.web.dto.ResetPasswordResponse;
import com.privod.platform.modules.auth.web.dto.UpdateAdminUserRequest;
import com.privod.platform.modules.auth.web.dto.UserActivityLogResponse;
import com.privod.platform.modules.auth.web.dto.UserResponse;
import com.privod.platform.modules.auth.web.dto.UserSessionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserSessionRepository userSessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ---- List / Get ----

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(String search, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Page<User> page;
        if (search != null && !search.isBlank()) {
            page = userRepository.searchUsersByOrganizationId(orgId, search.trim(), pageable);
        } else {
            page = userRepository.findAllActiveByOrganizationId(orgId, pageable);
        }
        return page.map(UserResponse::fromUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        User user = findUserInOrg(id, orgId);
        return UserResponse.fromUser(user);
    }

    // ---- Create ----

    @Transactional
    public UserResponse createUser(CreateAdminUserRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("User with email " + request.email() + " already exists");
        }

        Role role = roleRepository.findByCode(request.role())
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + request.role()));

        User user = User.builder()
                .email(request.email())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .passwordHash(passwordEncoder.encode(request.password()))
                .organizationId(orgId)
                .enabled(true)
                .build();
        user.addRole(role);

        User saved = userRepository.save(user);
        log.info("Admin created user {} (email={}, role={}) in org {}",
                saved.getId(), saved.getEmail(), request.role(), orgId);
        return UserResponse.fromUser(saved);
    }

    // ---- Update ----

    @Transactional
    public UserResponse updateUser(UUID id, UpdateAdminUserRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        User user = findUserInOrg(id, orgId);

        if (request.email() != null && !request.email().isBlank()) {
            // Check uniqueness if email is changing
            if (!user.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("User with email " + request.email() + " already exists");
            }
            user.setEmail(request.email());
        }
        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName());
        }
        if (request.role() != null && !request.role().isBlank()) {
            Role role = roleRepository.findByCode(request.role())
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + request.role()));
            user.getRoles().clear();
            user.addRole(role);
        }
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }

        User saved = userRepository.save(user);
        log.info("Admin updated user {} in org {}", saved.getId(), orgId);
        return UserResponse.fromUser(saved);
    }

    // ---- Block / Unblock ----

    @Transactional
    public void blockUser(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        User user = findUserInOrg(id, orgId);
        user.setEnabled(false);
        userRepository.save(user);
        log.info("Admin blocked user {} in org {}", id, orgId);
    }

    @Transactional
    public void unblockUser(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        User user = findUserInOrg(id, orgId);
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Admin unblocked user {} in org {}", id, orgId);
    }

    // ---- Reset Password ----

    @Transactional
    public ResetPasswordResponse resetPassword(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        User user = findUserInOrg(id, orgId);

        String tempPassword = generateTempPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        log.info("Admin reset password for user {} in org {}", id, orgId);
        return new ResetPasswordResponse(tempPassword);
    }

    // ---- Force Logout ----

    @Transactional
    public void forceLogout(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        // Verify user exists and belongs to org
        findUserInOrg(id, orgId);

        int deactivated = userSessionRepository.deactivateAllByUserId(id);
        log.info("Admin force-logged out user {} in org {} ({} sessions deactivated)", id, orgId, deactivated);
    }

    // ---- Sessions ----

    @Transactional(readOnly = true)
    public List<UserSessionResponse> getUserSessions(UUID userId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        // Verify user exists and belongs to org
        findUserInOrg(userId, orgId);

        List<UserSession> sessions = userSessionRepository
                .findByUserIdAndIsActiveTrueOrderByLastActivityAtDesc(userId);
        return sessions.stream()
                .map(UserSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ---- Activity Log ----

    @Transactional(readOnly = true)
    public List<UserActivityLogResponse> getUserActivityLog(UUID userId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        // Verify user exists and belongs to org
        findUserInOrg(userId, orgId);

        Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "attemptedAt"));
        Page<LoginAttempt> attempts = loginAttemptRepository.findByUserIdAndDeletedFalse(userId, pageable);

        return attempts.getContent().stream()
                .map(UserActivityLogResponse::fromLoginAttempt)
                .collect(Collectors.toList());
    }

    // ---- Helpers ----

    private User findUserInOrg(UUID id, UUID orgId) {
        return userRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
