package com.privod.platform.modules.auth;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.service.AuthService;
import com.privod.platform.modules.auth.web.dto.LoginRequest;
import com.privod.platform.modules.auth.web.dto.LoginResponse;
import com.privod.platform.modules.auth.web.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role viewerRole;

    @BeforeEach
    void setUp() {
        viewerRole = Role.builder()
                .id(UUID.randomUUID())
                .code("VIEWER")
                .name("Viewer")
                .systemRole(true)
                .permissions(new HashSet<>())
                .build();

        testUser = User.builder()
                .email("test@example.com")
                .passwordHash("$2a$10$hashedpassword")
                .firstName("Test")
                .lastName("User")
                .enabled(true)
                .roles(new HashSet<>(Set.of(viewerRole)))
                .build();
        testUser.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Login should return tokens when credentials are valid")
    void login_Success() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        Authentication authentication = mock(Authentication.class);
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("refresh-token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.expiresIn()).isEqualTo(86400000L);
        assertThat(response.user().email()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Login should throw BadCredentialsException when password is wrong")
    void login_InvalidCredentials() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong-password");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Register should create user and return tokens")
    void register_Success() {
        RegisterRequest request = new RegisterRequest(
                "new@example.com", "password123", "New", "User");

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(roleRepository.findByCode("VIEWER")).thenReturn(Optional.of(viewerRole));
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");

        User savedUser = User.builder()
                .email("new@example.com")
                .passwordHash("$2a$10$encoded")
                .firstName("New")
                .lastName("User")
                .enabled(true)
                .roles(new HashSet<>(Set.of(viewerRole)))
                .build();
        savedUser.setId(UUID.randomUUID());

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        when(userDetailsService.loadUserByUsername("new@example.com")).thenReturn(userDetails);
        when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("refresh-token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.user().email()).isEqualTo("new@example.com");
        assertThat(response.user().firstName()).isEqualTo("New");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register should throw when email already exists")
    void register_DuplicateEmail() {
        RegisterRequest request = new RegisterRequest(
                "existing@example.com", "password123", "Test", "User");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Token generation should include user details")
    void tokenGeneration_ContainsUserInfo() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        Authentication authentication = mock(Authentication.class);
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("token");
        when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("refresh");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponse response = authService.login(request);

        assertThat(response.user().firstName()).isEqualTo("Test");
        assertThat(response.user().lastName()).isEqualTo("User");
        assertThat(response.user().fullName()).isEqualTo("Test User");
        verify(jwtTokenProvider).generateToken(any(CustomUserDetails.class));
    }
}
