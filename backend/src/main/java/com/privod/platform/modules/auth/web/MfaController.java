package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.service.MfaService;
import com.privod.platform.modules.auth.domain.MfaMethod;
import com.privod.platform.modules.auth.web.dto.EnableMfaRequest;
import com.privod.platform.modules.auth.web.dto.MfaConfigResponse;
import com.privod.platform.modules.auth.web.dto.VerifyMfaRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/auth/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA", description = "Multi-factor authentication management")
@PreAuthorize("isAuthenticated()")
public class MfaController {

    private final MfaService mfaService;

    @PostMapping("/enable")
    @Operation(summary = "Enable MFA for a user")
    public ResponseEntity<ApiResponse<MfaConfigResponse>> enable(
            @Valid @RequestBody EnableMfaRequest request) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (request.userId() != null && !request.userId().equals(currentUserId)) {
            throw new AccessDeniedException("Cannot enable MFA for another user");
        }
        MfaConfigResponse response = mfaService.enableMfa(new EnableMfaRequest(currentUserId, request.method()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/disable")
    @Operation(summary = "Disable MFA for a user")
    public ResponseEntity<ApiResponse<Void>> disable(
            @RequestParam(required = false) UUID userId,
            @RequestParam MfaMethod method) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot disable MFA for another user");
        }
        mfaService.disableMfa(currentUserId, method);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify MFA code")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> verify(
            @Valid @RequestBody VerifyMfaRequest request,
            HttpServletRequest httpRequest) {
        boolean result = mfaService.verify(request,
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("verified", result)));
    }

    @GetMapping("/configs")
    @Operation(summary = "Get MFA configurations for a user")
    public ResponseEntity<ApiResponse<List<MfaConfigResponse>>> getConfigs(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access MFA configs for another user");
        }
        List<MfaConfigResponse> configs = mfaService.getUserMfaConfigs(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(configs));
    }

    @GetMapping("/status")
    @Operation(summary = "Check if user has MFA enabled")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> status(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access MFA status for another user");
        }
        boolean enabled = mfaService.hasMfaEnabled(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("mfaEnabled", enabled)));
    }
}
