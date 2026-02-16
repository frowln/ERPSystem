package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.service.SecurityPolicyService;
import com.privod.platform.modules.auth.web.dto.SecurityPolicyResponse;
import com.privod.platform.modules.auth.web.dto.UserSessionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/security")
@RequiredArgsConstructor
@Tag(name = "Security", description = "Security policy and session management")
public class SecurityPolicyController {

    private final SecurityPolicyService securityPolicyService;

    @GetMapping("/policy")
    @Operation(summary = "Get the active security policy")
    public ResponseEntity<ApiResponse<SecurityPolicyResponse>> getActivePolicy() {
        SecurityPolicyResponse response = securityPolicyService.getActivePolicy();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/sessions")
    @Operation(summary = "List active sessions for a user")
    public ResponseEntity<ApiResponse<List<UserSessionResponse>>> activeSessions(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access sessions for another user");
        }
        List<UserSessionResponse> sessions = securityPolicyService.getActiveSessions(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Terminate a specific session")
    public ResponseEntity<ApiResponse<Void>> terminateSession(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        securityPolicyService.terminateSessionForUser(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/sessions")
    @Operation(summary = "Terminate all sessions for a user")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> terminateAllSessions(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot terminate sessions for another user");
        }
        int count = securityPolicyService.terminateAllSessions(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("terminatedCount", count)));
    }

    @GetMapping("/account-locked")
    @Operation(summary = "Check if an account is locked due to failed login attempts")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isAccountLocked(
            @RequestParam String email) {
        boolean locked = securityPolicyService.isAccountLocked(email);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("locked", locked)));
    }

    @DeleteMapping("/sessions/expired")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Cleanup expired sessions")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> cleanupExpired() {
        int count = securityPolicyService.cleanupExpiredSessions();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("cleanedUp", count)));
    }
}
