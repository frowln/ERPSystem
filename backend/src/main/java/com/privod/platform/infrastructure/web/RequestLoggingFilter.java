package com.privod.platform.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Request logging filter that captures HTTP method, URI, status code,
 * and duration for every request.
 * <p>
 * Behaviour:
 * <ul>
 *   <li>Generates an {@code X-Request-Id} UUID if none is present in the incoming request</li>
 *   <li>Logs at DEBUG level for successful (2xx) responses</li>
 *   <li>Logs at INFO level for non-2xx responses (4xx, 5xx)</li>
 *   <li>Excludes noisy paths: /actuator, /health, /swagger, /api-docs</li>
 * </ul>
 */
@Component
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    private static final Set<String> EXCLUDED_PREFIXES = Set.of(
            "/actuator",
            "/api/health",
            "/swagger",
            "/api-docs",
            "/v3/api-docs"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Generate or propagate request ID
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put("requestId", requestId);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            String method = request.getMethod();
            String uri = request.getRequestURI();

            if (status >= 200 && status < 300) {
                log.debug("[{}] {} {} -> {} ({}ms)", requestId, method, uri, status, durationMs);
            } else {
                log.info("[{}] {} {} -> {} ({}ms)", requestId, method, uri, status, durationMs);
            }

            MDC.remove("requestId");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDED_PREFIXES.stream().anyMatch(path::startsWith);
    }
}
