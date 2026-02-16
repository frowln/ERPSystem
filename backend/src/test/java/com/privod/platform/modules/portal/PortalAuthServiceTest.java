package com.privod.platform.modules.portal;

import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.portal.domain.PortalRole;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.domain.PortalUserStatus;
import com.privod.platform.modules.portal.repository.PortalUserRepository;
import com.privod.platform.modules.portal.service.PortalAuthService;
import com.privod.platform.modules.portal.web.dto.PortalLoginRequest;
import com.privod.platform.modules.portal.web.dto.PortalLoginResponse;
import com.privod.platform.modules.portal.web.dto.PortalRegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortalAuthServiceTest {

    @Mock
    private PortalUserRepository portalUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private PortalAuthService portalAuthService;

    private PortalUser testUser;

    @BeforeEach
    void setUp() {
        testUser = PortalUser.builder()
                .email("contractor@test.ru")
                .passwordHash("$2a$10$hashedpassword")
                .firstName("Иван")
                .lastName("Петров")
                .phone("+79001234567")
                .organizationName("ООО Стройка")
                .inn("1234567890")
                .portalRole(PortalRole.CONTRACTOR)
                .status(PortalUserStatus.ACTIVE)
                .build();
        testUser.setId(UUID.randomUUID());
        testUser.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Register")
    class RegisterTests {

        @Test
        @DisplayName("Should register new portal user with PENDING status")
        void register_Success() {
            PortalRegisterRequest request = new PortalRegisterRequest(
                    "new@test.ru", "password123", "Мария", "Иванова",
                    "+79001234568", "ООО Подрядчик", "9876543210", PortalRole.SUBCONTRACTOR
            );

            when(portalUserRepository.existsByEmailAndDeletedFalse("new@test.ru")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPassword");
            when(portalUserRepository.save(any(PortalUser.class))).thenAnswer(invocation -> {
                PortalUser u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                u.setCreatedAt(Instant.now());
                return u;
            });
            when(jwtTokenProvider.generateToken(any(UserDetails.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

            PortalLoginResponse response = portalAuthService.register(request);

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token");
            assertThat(response.user().email()).isEqualTo("new@test.ru");
            assertThat(response.user().portalRole()).isEqualTo(PortalRole.SUBCONTRACTOR);
            assertThat(response.user().status()).isEqualTo(PortalUserStatus.PENDING);
        }

        @Test
        @DisplayName("Should throw when email already registered")
        void register_DuplicateEmail() {
            PortalRegisterRequest request = new PortalRegisterRequest(
                    "contractor@test.ru", "password123", "Мария", "Иванова",
                    null, null, null, PortalRole.CUSTOMER
            );

            when(portalUserRepository.existsByEmailAndDeletedFalse("contractor@test.ru")).thenReturn(true);

            assertThatThrownBy(() -> portalAuthService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже зарегистрирован");
        }
    }

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("Should login active portal user")
        void login_Success() {
            PortalLoginRequest request = new PortalLoginRequest("contractor@test.ru", "password123");

            when(portalUserRepository.findByEmailAndDeletedFalse("contractor@test.ru"))
                    .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(true);
            when(portalUserRepository.save(any(PortalUser.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtTokenProvider.generateToken(any(UserDetails.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

            PortalLoginResponse response = portalAuthService.login(request);

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.user().email()).isEqualTo("contractor@test.ru");
            assertThat(response.user().portalRole()).isEqualTo(PortalRole.CONTRACTOR);
        }

        @Test
        @DisplayName("Should throw on wrong password")
        void login_WrongPassword() {
            PortalLoginRequest request = new PortalLoginRequest("contractor@test.ru", "wrongpassword");

            when(portalUserRepository.findByEmailAndDeletedFalse("contractor@test.ru"))
                    .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongpassword", "$2a$10$hashedpassword")).thenReturn(false);

            assertThatThrownBy(() -> portalAuthService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Неверный email или пароль");
        }

        @Test
        @DisplayName("Should throw when user is blocked")
        void login_BlockedUser() {
            testUser.setStatus(PortalUserStatus.BLOCKED);
            PortalLoginRequest request = new PortalLoginRequest("contractor@test.ru", "password123");

            when(portalUserRepository.findByEmailAndDeletedFalse("contractor@test.ru"))
                    .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(true);

            assertThatThrownBy(() -> portalAuthService.login(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("заблокирована");
        }
    }
}
