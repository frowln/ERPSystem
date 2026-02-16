package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.portal.service.PortalAuthService;
import com.privod.platform.modules.portal.web.dto.ForgotPasswordRequest;
import com.privod.platform.modules.portal.web.dto.PortalLoginRequest;
import com.privod.platform.modules.portal.web.dto.PortalLoginResponse;
import com.privod.platform.modules.portal.web.dto.PortalRegisterRequest;
import com.privod.platform.modules.portal.web.dto.ResetPasswordRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/auth")
@RequiredArgsConstructor
@Tag(name = "Portal Auth", description = "Portal user authentication endpoints")
public class PortalAuthController {

    private final PortalAuthService portalAuthService;

    @PostMapping("/register")
    @Operation(summary = "Register a new portal user")
    public ResponseEntity<ApiResponse<PortalLoginResponse>> register(
            @Valid @RequestBody PortalRegisterRequest request) {
        PortalLoginResponse response = portalAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login portal user")
    public ResponseEntity<ApiResponse<PortalLoginResponse>> login(
            @Valid @RequestBody PortalLoginRequest request) {
        PortalLoginResponse response = portalAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset for portal user")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        portalAuthService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset portal user password with token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        portalAuthService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
