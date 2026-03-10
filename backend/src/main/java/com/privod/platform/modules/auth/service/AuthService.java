package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.admin.domain.LoginAuditLog;
import com.privod.platform.modules.admin.repository.LoginAuditLogRepository;
import com.privod.platform.modules.admin.service.SystemSettingService;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.web.dto.ChangePasswordRequest;
import com.privod.platform.modules.auth.web.dto.LoginRequest;
import com.privod.platform.modules.auth.web.dto.LoginResponse;
import com.privod.platform.modules.auth.web.dto.RefreshTokenRequest;
import com.privod.platform.modules.auth.web.dto.RegisterRequest;
import com.privod.platform.modules.auth.web.dto.UserResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final LoginAuditLogRepository loginAuditLogRepository;
    private final SystemSettingService systemSettingService;
    private final TwoFactorService twoFactorService;

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.email();
        String ip = extractIp(httpRequest);
        String ua = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;

        // 1) Check account lockout
        int maxAttempts = parseInt(systemSettingService.getSettingValue("max_login_attempts", "5"));
        int lockoutMinutes = parseInt(systemSettingService.getSettingValue("lockout_duration_minutes", "15"));
        Instant lockoutWindow = Instant.now().minus(lockoutMinutes, ChronoUnit.MINUTES);
        long recentFailed = loginAuditLogRepository.countByEmailAndSuccessFalseAndCreatedAtAfter(email, lockoutWindow);
        if (recentFailed >= maxAttempts) {
            recordLogin(null, email, "LOGIN_FAILED", ip, ua, false, "ACCOUNT_LOCKED");
            throw new LockedException("Аккаунт временно заблокирован. Попробуйте через " + lockoutMinutes + " минут.");
        }

        // 2) Authenticate
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException ex) {
            recordLogin(null, email, "LOGIN_FAILED", ip, ua, false, ex.getMessage());
            throw ex;
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 3) Check 2FA — if enabled, return response with requiresTwoFactor=true
        if (user.isTwoFactorEnabled()) {
            // Generate a short-lived temp token for 2FA verification step
            String tempToken = jwtTokenProvider.generateTempToken(email);
            recordLogin(user.getId(), email, "LOGIN_2FA_REQUIRED", ip, ua, true, null);
            return new LoginResponse(null, null, 0, UserResponse.fromUser(user), true, tempToken);
        }

        // 4) Success — issue tokens
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        recordLogin(user.getId(), email, "LOGIN_SUCCESS", ip, ua, true, null);
        log.info("User logged in: {}", email);

        return new LoginResponse(accessToken, refreshToken, jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user), false, null);
    }

    /** Backward-compatible overload for calls without HttpServletRequest */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        return login(request, null);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered: " + request.email());
        }

        // Validate password against policy
        validatePasswordPolicy(request.password());

        Role viewerRole = roleRepository.findByCode("VIEWER")
                .orElseThrow(() -> new IllegalStateException("Default VIEWER role not found"));

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .enabled(true)
                .build();
        user.addRole(viewerRole);

        user = userRepository.save(user);
        log.info("New user registered: {}", request.email());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return new LoginResponse(accessToken, refreshToken, jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user), false, null);
    }

    @Transactional(readOnly = true)
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();

        if (!jwtTokenProvider.validateToken(token)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        if (!jwtTokenProvider.isRefreshToken(token)) {
            throw new BadCredentialsException("Token is not a refresh token");
        }

        String username = jwtTokenProvider.getUsernameFromToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        String newAccessToken = jwtTokenProvider.generateToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return new LoginResponse(
                newAccessToken,
                newRefreshToken,
                jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user)
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException("Not authenticated");
        }

        String email;
        if (authentication.getPrincipal() instanceof CustomUserDetails customUserDetails) {
            email = customUserDetails.getEmail();
        } else {
            email = authentication.getName();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return UserResponse.fromUser(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        validatePasswordPolicy(request.newPassword());

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", email);
    }

    @Transactional
    public LoginResponse verifyTwoFactorLogin(
            com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest request,
            HttpServletRequest httpRequest) {
        String ip = extractIp(httpRequest);
        String ua = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;

        // Validate temp token
        if (!jwtTokenProvider.validateToken(request.tempToken())) {
            throw new BadCredentialsException("Временный токен истёк или недействителен");
        }
        String email = jwtTokenProvider.getUsernameFromToken(request.tempToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Verify TOTP code
        boolean codeValid = twoFactorService.verifyCode(user.getTwoFactorSecret(), request.code());

        // Check recovery codes if TOTP failed
        if (!codeValid && user.getTwoFactorRecoveryCodes() != null) {
            String[] codes = user.getTwoFactorRecoveryCodes().split(",");
            for (int i = 0; i < codes.length; i++) {
                if (codes[i].trim().equals(request.code())) {
                    codeValid = true;
                    codes[i] = "USED";
                    user.setTwoFactorRecoveryCodes(String.join(",", codes));
                    break;
                }
            }
        }

        if (!codeValid) {
            recordLogin(user.getId(), email, "LOGIN_FAILED", ip, ua, false, "INVALID_2FA_CODE");
            throw new BadCredentialsException("Неверный код двухфакторной аутентификации");
        }

        // Issue real tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        recordLogin(user.getId(), email, "LOGIN_SUCCESS", ip, ua, true, null);
        log.info("User logged in with 2FA: {}", email);

        return new LoginResponse(accessToken, refreshToken, jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user), false, null);
    }

    /** Backward-compatible overload */
    @Transactional
    public LoginResponse verifyTwoFactorLogin(
            com.privod.platform.modules.auth.web.dto.TwoFactorLoginRequest request) {
        return verifyTwoFactorLogin(request, null);
    }

    // ── Password Policy Validation ──────────────────────────────────────────

    private void validatePasswordPolicy(String password) {
        List<String> errors = new ArrayList<>();

        int minLength = parseInt(systemSettingService.getSettingValue("password_min_length", "8"));
        if (password.length() < minLength) {
            errors.add("Пароль должен содержать минимум " + minLength + " символов");
        }

        if ("true".equals(systemSettingService.getSettingValue("password_require_digits", "false"))) {
            if (!password.matches(".*\\d.*")) {
                errors.add("Пароль должен содержать хотя бы одну цифру");
            }
        }

        if ("true".equals(systemSettingService.getSettingValue("password_require_special", "false"))) {
            if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
                errors.add("Пароль должен содержать хотя бы один спецсимвол");
            }
        }

        if ("true".equals(systemSettingService.getSettingValue("password_require_uppercase", "false"))) {
            if (!password.matches(".*[A-ZА-ЯЁ].*")) {
                errors.add("Пароль должен содержать хотя бы одну заглавную букву");
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join("; ", errors));
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void recordLogin(java.util.UUID userId, String email, String action,
                             String ip, String ua, boolean success, String failureReason) {
        try {
            loginAuditLogRepository.save(LoginAuditLog.builder()
                    .userId(userId)
                    .email(email)
                    .action(action)
                    .ipAddress(ip)
                    .userAgent(ua)
                    .success(success)
                    .failureReason(failureReason)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to record login audit: {}", e.getMessage());
        }
    }

    private String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private int parseInt(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
