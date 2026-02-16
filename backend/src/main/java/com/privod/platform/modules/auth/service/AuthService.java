package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        log.info("User logged in: {}", request.email());

        return new LoginResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user)
        );
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered: " + request.email());
        }

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

        return new LoginResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getExpirationMs(),
                UserResponse.fromUser(user)
        );
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

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", email);
    }
}
