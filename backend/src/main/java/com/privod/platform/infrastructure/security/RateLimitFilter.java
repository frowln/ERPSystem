package com.privod.platform.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory rate limiter using a sliding-window counter per IP address.
 * <p>
 * Default: 100 requests per minute for general API, 10 requests per minute for auth endpoints.
 * Configurable via application.yml:
 * <pre>
 *   app.rate-limit.requests-per-minute: 100
 *   app.rate-limit.auth-requests-per-minute: 10
 * </pre>
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    @Value("${app.rate-limit.requests-per-minute:100}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.auth-requests-per-minute:10}")
    private int authRequestsPerMinute;

    private final ConcurrentHashMap<String, SlidingWindow> generalBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SlidingWindow> authBuckets = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String clientIp = resolveClientIp(request);
        String path = request.getRequestURI();

        boolean isAuthEndpoint = path.startsWith("/api/auth/");
        ConcurrentHashMap<String, SlidingWindow> buckets = isAuthEndpoint ? authBuckets : generalBuckets;
        int limit = isAuthEndpoint ? authRequestsPerMinute : requestsPerMinute;

        SlidingWindow window = buckets.computeIfAbsent(clientIp, k -> new SlidingWindow());

        if (!window.tryAcquire(limit)) {
            log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", "0");

            objectMapper.writeValue(response.getWriter(), Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", "Превышен лимит запросов. Попробуйте через минуту."
            ));
            return;
        }

        int remaining = Math.max(0, limit - window.getCount());
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api-docs")
                || path.equals("/ws");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Periodically clean up expired windows (called by scheduler).
     */
    public void cleanup() {
        long now = System.currentTimeMillis();
        generalBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > WINDOW_MS * 2);
        authBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > WINDOW_MS * 2);
    }

    /**
     * Simple sliding-window counter. Resets the counter when the current time
     * falls outside the previous window.
     */
    private static class SlidingWindow {
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger(0);

        boolean tryAcquire(int limit) {
            long now = System.currentTimeMillis();
            long start = windowStart.get();

            if (now - start > WINDOW_MS) {
                windowStart.set(now);
                count.set(1);
                return true;
            }

            return count.incrementAndGet() <= limit;
        }

        int getCount() {
            long now = System.currentTimeMillis();
            if (now - windowStart.get() > WINDOW_MS) {
                return 0;
            }
            return count.get();
        }
    }
}
