package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.auth.service.AuthService;
import com.privod.platform.modules.auth.web.dto.ChangePasswordRequest;
import com.privod.platform.modules.auth.web.dto.LoginRequest;
import com.privod.platform.modules.auth.web.dto.LoginResponse;
import com.privod.platform.modules.auth.web.dto.RefreshTokenRequest;
import com.privod.platform.modules.auth.web.dto.RegisterRequest;
import com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest;
import com.privod.platform.modules.auth.web.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get JWT tokens")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        LoginResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/login/2fa")
    @Operation(summary = "Complete login with 2FA code")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyTwoFactor(
            @Valid @RequestBody TwoFactorLoginRequest request,
            HttpServletRequest httpRequest) {
        LoginResponse response = authService.verifyTwoFactorLogin(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT access token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user information")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change current user password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
