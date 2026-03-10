package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.service.AuthService;
import com.privod.platform.modules.auth.service.TwoFactorService;
import com.privod.platform.modules.auth.web.dto.LoginResponse;
import com.privod.platform.modules.auth.web.dto.TwoFactorDisableRequest;
import com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest;
import com.privod.platform.modules.auth.web.dto.TwoFactorSetupResponse;
import com.privod.platform.modules.auth.web.dto.TwoFactorVerifySetupRequest;
import com.privod.platform.modules.auth.web.dto.TwoFactorVerifySetupResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Two-Factor Authentication", description = "TOTP-based two-factor authentication endpoints")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/setup")
    @Operation(summary = "Generate TOTP secret and QR code URI for 2FA setup")
    @Transactional
    public ResponseEntity<ApiResponse<TwoFactorSetupResponse>> setup() {
        User user = getCurrentUser();

        if (user.isTwoFactorEnabled()) {
            throw new IllegalStateException("Двухфакторная аутентификация уже включена");
        }

        // Generate a new secret and save it (not yet enabled)
        String secret = twoFactorService.generateSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String qrCodeUri = twoFactorService.generateQrCodeUri(secret, user.getEmail());

        log.info("2FA setup initiated for user: {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.ok(new TwoFactorSetupResponse(secret, qrCodeUri)));
    }

    @PostMapping("/verify-setup")
    @Operation(summary = "Verify TOTP code to complete 2FA setup")
    @Transactional
    public ResponseEntity<ApiResponse<TwoFactorVerifySetupResponse>> verifySetup(
            @Valid @RequestBody TwoFactorVerifySetupRequest request) {
        User user = getCurrentUser();

        if (user.isTwoFactorEnabled()) {
            throw new IllegalStateException("Двухфакторная аутентификация уже включена");
        }

        if (user.getTwoFactorSecret() == null) {
            throw new IllegalStateException("Сначала необходимо запустить настройку 2FA (POST /api/auth/2fa/setup)");
        }

        // Verify the code against the stored secret
        boolean isValid = twoFactorService.verifyCode(user.getTwoFactorSecret(), request.code());
        if (!isValid) {
            throw new BadCredentialsException("Неверный код. Проверьте настройку приложения-аутентификатора.");
        }

        // Enable 2FA and generate recovery codes
        List<String> recoveryCodes = twoFactorService.generateRecoveryCodes();
        user.setTwoFactorEnabled(true);
        user.setTwoFactorRecoveryCodes(String.join(",", recoveryCodes));
        userRepository.save(user);

        log.info("2FA enabled for user: {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.ok(new TwoFactorVerifySetupResponse(recoveryCodes)));
    }

    @PostMapping("/disable")
    @Operation(summary = "Disable 2FA (requires current password and TOTP code)")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> disable(
            @Valid @RequestBody TwoFactorDisableRequest request) {
        User user = getCurrentUser();

        if (!user.isTwoFactorEnabled()) {
            throw new IllegalStateException("Двухфакторная аутентификация не включена");
        }

        // Verify current password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Неверный пароль");
        }

        // Verify TOTP code (or recovery code)
        boolean isValid = twoFactorService.verifyCode(user.getTwoFactorSecret(), request.code());
        if (!isValid && user.getTwoFactorRecoveryCodes() != null) {
            // Try recovery code
            String[] codes = user.getTwoFactorRecoveryCodes().split(",");
            isValid = java.util.Arrays.asList(codes).contains(request.code().toUpperCase());
        }

        if (!isValid) {
            throw new BadCredentialsException("Неверный код двухфакторной аутентификации");
        }

        // Disable 2FA
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.setTwoFactorRecoveryCodes(null);
        userRepository.save(user);

        log.info("2FA disabled for user: {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify 2FA code during login flow")
    public ResponseEntity<ApiResponse<LoginResponse>> verify(
            @Valid @RequestBody TwoFactorLoginRequest request) {
        LoginResponse response = authService.verifyTwoFactorLogin(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException("Не аутентифицирован");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
    }
}
