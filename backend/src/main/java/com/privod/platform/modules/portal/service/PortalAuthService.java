package com.privod.platform.modules.portal.service;

import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.domain.PortalUserStatus;
import com.privod.platform.modules.portal.repository.PortalUserRepository;
import com.privod.platform.modules.portal.web.dto.ForgotPasswordRequest;
import com.privod.platform.modules.portal.web.dto.PortalLoginRequest;
import com.privod.platform.modules.portal.web.dto.PortalLoginResponse;
import com.privod.platform.modules.portal.web.dto.PortalRegisterRequest;
import com.privod.platform.modules.portal.web.dto.PortalUserResponse;
import com.privod.platform.modules.portal.web.dto.ResetPasswordRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalAuthService {

    private final PortalUserRepository portalUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public PortalLoginResponse register(PortalRegisterRequest request) {
        if (portalUserRepository.existsByEmailAndDeletedFalse(request.email())) {
            throw new IllegalArgumentException("Пользователь с таким email уже зарегистрирован: " + request.email());
        }

        PortalUser user = PortalUser.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phone(request.phone())
                .organizationName(request.organizationName())
                .inn(request.inn())
                .portalRole(request.portalRole())
                .status(PortalUserStatus.PENDING)
                .build();

        user = portalUserRepository.save(user);
        log.info("Portal user registered: {} ({})", user.getEmail(), user.getId());

        UserDetails userDetails = buildUserDetails(user);
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return new PortalLoginResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getExpirationMs(),
                PortalUserResponse.fromEntity(user)
        );
    }

    @Transactional
    public PortalLoginResponse login(PortalLoginRequest request) {
        PortalUser user = portalUserRepository.findByEmailAndDeletedFalse(request.email())
                .orElseThrow(() -> new BadCredentialsException("Неверный email или пароль"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Неверный email или пароль");
        }

        if (user.getStatus() == PortalUserStatus.BLOCKED) {
            throw new IllegalStateException("Учетная запись заблокирована. Обратитесь к администратору.");
        }

        user.setLastLoginAt(Instant.now());
        portalUserRepository.save(user);

        log.info("Portal user logged in: {} ({})", user.getEmail(), user.getId());

        UserDetails userDetails = buildUserDetails(user);
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return new PortalLoginResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getExpirationMs(),
                PortalUserResponse.fromEntity(user)
        );
    }

    @Transactional(readOnly = true)
    public void forgotPassword(ForgotPasswordRequest request) {
        portalUserRepository.findByEmailAndDeletedFalse(request.email())
                .ifPresent(user -> {
                    // In production: generate token, send email
                    log.info("Password reset requested for portal user: {}", request.email());
                });
        // Always return success to prevent email enumeration
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // In production: validate reset token, find user by token
        // For now, this is a placeholder implementation
        log.info("Password reset with token: {}", request.token());
        throw new EntityNotFoundException("Недействительный или истекший токен сброса пароля");
    }

    private UserDetails buildUserDetails(PortalUser user) {
        return new User(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_PORTAL_" + user.getPortalRole().name()))
        );
    }
}
