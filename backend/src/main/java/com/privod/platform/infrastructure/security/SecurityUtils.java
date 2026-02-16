package com.privod.platform.infrastructure.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Small helper to consistently access authenticated user information.
 * <p>
 * Important: Multi-tenancy enforcement must derive organizationId from the principal,
 * not from request parameters/bodies.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<CustomUserDetails> getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof CustomUserDetails details) {
            return Optional.of(details);
        }
        return Optional.empty();
    }

    public static Optional<UUID> getCurrentUserId() {
        return getCurrentUserDetails().map(CustomUserDetails::getId);
    }

    public static Optional<UUID> getCurrentOrganizationId() {
        return getCurrentUserDetails().map(CustomUserDetails::getOrganizationId);
    }

    public static UUID requireCurrentUserId() {
        return getCurrentUserId()
                .orElseThrow(() -> new AccessDeniedException("User context is required"));
    }

    public static UUID requireCurrentOrganizationId() {
        return getCurrentOrganizationId()
                .orElseThrow(() -> new AccessDeniedException("Organization context is required"));
    }

    public static boolean hasRole(String roleCode) {
        String expected = "ROLE_" + roleCode;
        return getCurrentUserDetails()
                .map(CustomUserDetails::getAuthorities)
                .stream()
                .flatMap(a -> a.stream().map(GrantedAuthority::getAuthority))
                .anyMatch(expected::equals);
    }
}

