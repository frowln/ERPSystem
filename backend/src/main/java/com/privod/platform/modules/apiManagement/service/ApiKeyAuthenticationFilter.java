package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.modules.apiManagement.domain.ApiKey;
import com.privod.platform.modules.apiManagement.repository.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";
    private final ApiKeyRepository apiKeyRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKeyHeader = request.getHeader(API_KEY_HEADER);
        if (apiKeyHeader == null || apiKeyHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String keyHash = hashKey(apiKeyHeader);
            ApiKey apiKey = apiKeyRepository.findByKeyHashAndIsActiveTrueAndDeletedFalse(keyHash)
                    .orElse(null);

            if (apiKey != null) {
                if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(Instant.now())) {
                    log.warn("Expired API key used: {}", apiKey.getPrefix());
                    filterChain.doFilter(request, response);
                    return;
                }

                apiKey.setLastUsedAt(Instant.now());
                apiKey.setRequestCount(apiKey.getRequestCount() + 1);
                apiKeyRepository.save(apiKey);

                var auth = new UsernamePasswordAuthenticationToken(
                        apiKey.getUserId(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_API_USER"))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("Authenticated via API key: {}", apiKey.getPrefix());
            }
        } catch (Exception e) {
            log.error("Error processing API key: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
