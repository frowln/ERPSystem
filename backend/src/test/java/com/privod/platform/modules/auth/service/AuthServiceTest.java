package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.LoginAttemptRepository;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.web.dto.ChangePasswordRequest;
import com.privod.platform.modules.auth.web.dto.LoginRequest;
import com.privod.platform.modules.auth.web.dto.LoginResponse;
import com.privod.platform.modules.auth.web.dto.RefreshTokenRequest;
import com.privod.platform.modules.auth.web.dto.RegisterRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserDetailsService userDetailsService;
    @Mock private LoginAttemptRepository loginAttemptRepository;
    @Mock private MfaService mfaService;

    private AuthService authService;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        // AuthService uses explicit constructor with @Value parameter
        authService = new AuthService(
                authenticationManager, userRepository, roleRepository,
                passwordEncoder, jwtTokenProvider, userDetailsService,
                loginAttemptRepository, mfaService, false);

        userId = UUID.randomUUID();
        testUser = User.builder()
                .email("test@privod.com")
                .passwordHash("$2a$10$hashedpassword")
                .firstName("Test")
                .lastName("User")
                .enabled(true)
                .build();
        testUser.setId(userId);
        testUser.setCreatedAt(Instant.now());
        testUser.setRoles(new HashSet<>());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully without MFA")
        void shouldLogin_withoutMfa() {
            LoginRequest request = new LoginRequest("test@privod.com", "password123");

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));

            UserDetails userDetails = mock(UserDetails.class);
            Authentication auth = mock(Authentication.class);
            when(auth.getPrincipal()).thenReturn(userDetails);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(auth);
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(mfaService.hasMfaEnabled(userId)).thenReturn(false);
            when(jwtTokenProvider.generateToken(userDetails)).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(userDetails)).thenReturn("refresh-token");
            when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

            LoginResponse response = authService.login(request);

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token");
            assertThat(response.mfaRequired()).isFalse();
            verify(loginAttemptRepository).save(any());
        }

        @Test
        @DisplayName("Should return MFA challenge when MFA enabled")
        void shouldReturnMfaChallenge_whenMfaEnabled() {
            LoginRequest request = new LoginRequest("test@privod.com", "password123");

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));

            Authentication auth = mock(Authentication.class);
            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(mfaService.hasMfaEnabled(userId)).thenReturn(true);
            when(jwtTokenProvider.generateMfaChallengeToken(userId.toString()))
                    .thenReturn("mfa-challenge-token");

            LoginResponse response = authService.login(request);

            assertThat(response.mfaRequired()).isTrue();
            assertThat(response.mfaChallengeToken()).isEqualTo("mfa-challenge-token");
            assertThat(response.accessToken()).isNull();
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrow_whenUserNotFound() {
            LoginRequest request = new LoginRequest("unknown@privod.com", "password123");
            when(userRepository.findByEmail("unknown@privod.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Should throw when account is locked")
        void shouldThrow_whenAccountLocked() {
            LoginRequest request = new LoginRequest("test@privod.com", "password123");
            testUser.setFailedLoginAttempts(5);
            testUser.setLockedUntil(Instant.now().plusSeconds(600));

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(LockedException.class)
                    .hasMessageContaining("locked");
        }

        @Test
        @DisplayName("Should record failed login and lock account after 5 failures")
        void shouldRecordFailedLogin() {
            LoginRequest request = new LoginRequest("test@privod.com", "wrongpassword");
            testUser.setFailedLoginAttempts(4);

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(LockedException.class);
        }
    }

    @Nested
    @DisplayName("Register")
    class RegisterTests {

        @Test
        @DisplayName("Should throw when open registration is disabled")
        void shouldThrow_whenRegistrationDisabled() {
            RegisterRequest request = new RegisterRequest(
                    "new@privod.com", "password123", "New", "User");

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("disabled");
        }

        @Test
        @DisplayName("Should register user when open registration is enabled")
        void shouldRegister_whenEnabled() {
            AuthService openRegService = new AuthService(
                    authenticationManager, userRepository, roleRepository,
                    passwordEncoder, jwtTokenProvider, userDetailsService,
                    loginAttemptRepository, mfaService, true);

            RegisterRequest request = new RegisterRequest(
                    "new@privod.com", "password123", "New", "User");

            when(userRepository.existsByEmail("new@privod.com")).thenReturn(false);
            Role viewerRole = mock(Role.class);
            when(viewerRole.getCode()).thenReturn("VIEWER");
            when(roleRepository.findByCode("VIEWER")).thenReturn(Optional.of(viewerRole));
            when(passwordEncoder.encode("password123")).thenReturn("$2a$encoded");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                u.setCreatedAt(Instant.now());
                u.setRoles(Set.of(viewerRole));
                return u;
            });

            UserDetails userDetails = mock(UserDetails.class);
            when(userDetailsService.loadUserByUsername("new@privod.com")).thenReturn(userDetails);
            when(jwtTokenProvider.generateToken(userDetails)).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(userDetails)).thenReturn("refresh-token");
            when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

            LoginResponse response = openRegService.register(request);

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.mfaRequired()).isFalse();
        }

        @Test
        @DisplayName("Should throw when email already registered")
        void shouldThrow_whenEmailExists() {
            AuthService openRegService = new AuthService(
                    authenticationManager, userRepository, roleRepository,
                    passwordEncoder, jwtTokenProvider, userDetailsService,
                    loginAttemptRepository, mfaService, true);

            RegisterRequest request = new RegisterRequest(
                    "existing@privod.com", "password123", "Dup", "User");

            when(userRepository.existsByEmail("existing@privod.com")).thenReturn(true);

            assertThatThrownBy(() -> openRegService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already registered");
        }
    }

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenTests {

        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshToken() {
            RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

            when(jwtTokenProvider.validateToken("valid-refresh-token")).thenReturn(true);
            when(jwtTokenProvider.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtTokenProvider.getUsernameFromToken("valid-refresh-token")).thenReturn("test@privod.com");

            UserDetails userDetails = mock(UserDetails.class);
            when(userDetailsService.loadUserByUsername("test@privod.com")).thenReturn(userDetails);
            when(jwtTokenProvider.generateToken(userDetails)).thenReturn("new-access-token");
            when(jwtTokenProvider.generateRefreshToken(userDetails)).thenReturn("new-refresh-token");
            when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);
            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));

            LoginResponse response = authService.refreshToken(request);

            assertThat(response.accessToken()).isEqualTo("new-access-token");
            assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
        }

        @Test
        @DisplayName("Should throw when refresh token invalid")
        void shouldThrow_whenTokenInvalid() {
            RefreshTokenRequest request = new RefreshTokenRequest("invalid-token");
            when(jwtTokenProvider.validateToken("invalid-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Should throw when token is not a refresh token")
        void shouldThrow_whenNotRefreshToken() {
            RefreshTokenRequest request = new RefreshTokenRequest("access-token");
            when(jwtTokenProvider.validateToken("access-token")).thenReturn(true);
            when(jwtTokenProvider.isRefreshToken("access-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("not a refresh token");
        }
    }

    @Nested
    @DisplayName("Change Password")
    class ChangePasswordTests {

        @Test
        @DisplayName("Should change password when current password matches")
        void shouldChangePassword() {
            Authentication auth = mock(Authentication.class);
            when(auth.getName()).thenReturn("test@privod.com");
            SecurityContext secCtx = mock(SecurityContext.class);
            when(secCtx.getAuthentication()).thenReturn(auth);
            SecurityContextHolder.setContext(secCtx);

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("oldPassword", testUser.getPasswordHash())).thenReturn(true);
            when(passwordEncoder.encode("newPassword")).thenReturn("$2a$newEncoded");
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword");
            authService.changePassword(request);

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw when current password is wrong")
        void shouldThrow_whenCurrentPasswordWrong() {
            Authentication auth = mock(Authentication.class);
            when(auth.getName()).thenReturn("test@privod.com");
            SecurityContext secCtx = mock(SecurityContext.class);
            when(secCtx.getAuthentication()).thenReturn(auth);
            SecurityContextHolder.setContext(secCtx);

            when(userRepository.findByEmail("test@privod.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongPassword", testUser.getPasswordHash())).thenReturn(false);

            ChangePasswordRequest request = new ChangePasswordRequest("wrongPassword", "newPassword");

            assertThatThrownBy(() -> authService.changePassword(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("incorrect");
        }
    }
}
