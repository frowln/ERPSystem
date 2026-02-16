package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.web.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(String search, Pageable pageable) {
        // Tenant isolation: tenant admins can only manage users within their organization.
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
        User user = userRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found: " + id));
        return UserResponse.fromUser(user);
    }
}
