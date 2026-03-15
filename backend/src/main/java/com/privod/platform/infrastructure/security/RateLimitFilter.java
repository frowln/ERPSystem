package com.privod.platform.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate limiter using Redis sliding-window counters per IP address.
 * Falls back to in-memory ConcurrentHashMap if Redis is unavailable.
 * <p>
 * Default: 600 requests per minute for general API, 10 requests per minute for auth endpoints.
 * Configurable via application.yml:
 * <pre>
 *   app.rate-limit.requests-per-minute: 600
 *   app.rate-limit.auth-requests-per-minute: 10
 * </pre>
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;
    private static final String REDIS_KEY_PREFIX = "rate_limit:";
    private static final Duration REDIS_KEY_TTL = Duration.ofSeconds(120); // 2 min safety margin

    @Value("${app.rate-limit.requests-per-minute:600}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.auth-requests-per-minute:10}")
    private int authRequestsPerMinute;

    private final StringRedisTemplate redisTemplate;
    private final MessageSource messageSource;

    // In-memory fallback buckets
    private final ConcurrentHashMap<String, SlidingWindow> generalBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SlidingWindow> authBuckets = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Track whether we've already warned about Redis fallback to avoid log spam
    private final AtomicBoolean redisFallbackWarned = new AtomicBoolean(false);

    /**
     * Constructor: StringRedisTemplate is injected if available.
     * If Redis is not configured, Spring will still provide the bean from spring-boot-starter-data-redis,
     * but connections may fail at runtime — that's handled gracefully.
     */
    @Autowired
    public RateLimitFilter(@Autowired(required = false) StringRedisTemplate redisTemplate,
                           MessageSource messageSource) {
        this.redisTemplate = redisTemplate;
        this.messageSource = messageSource;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String clientIp = resolveClientIp(request);
        String path = request.getRequestURI();

        boolean isAuthEndpoint = path.startsWith("/api/auth/");
        int limit = isAuthEndpoint ? authRequestsPerMinute : requestsPerMinute;

        RateLimitResult result = tryAcquire(clientIp, isAuthEndpoint, limit);

        if (!result.allowed) {
            log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", "0");

            String message = messageSource.getMessage("error.rate_limit", null,
                    "Rate limit exceeded. Please try again in a minute.", LocaleContextHolder.getLocale());

            objectMapper.writeValue(response.getWriter(), Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", message
            ));
            return;
        }

        int remaining = Math.max(0, limit - result.currentCount);
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

    /**
     * Attempts to acquire a rate limit token. Tries Redis first, falls back to in-memory.
     */
    private RateLimitResult tryAcquire(String clientIp, boolean isAuth, int limit) {
        if (redisTemplate != null) {
            try {
                return tryAcquireRedis(clientIp, isAuth, limit);
            } catch (Exception e) {
                // Redis connection failed — fall back silently
                if (redisFallbackWarned.compareAndSet(false, true)) {
                    log.warn("Redis unavailable for rate limiting, falling back to in-memory counters: {}",
                            e.getMessage());
                }
                return tryAcquireInMemory(clientIp, isAuth, limit);
            }
        }
        return tryAcquireInMemory(clientIp, isAuth, limit);
    }

    /**
     * Redis-based rate limiting using INCR + EXPIRE on a per-minute bucket key.
     * Key pattern: rate_limit:{general|auth}:{ip}:{minute_bucket}
     */
    private RateLimitResult tryAcquireRedis(String clientIp, boolean isAuth, int limit) {
        long minuteBucket = System.currentTimeMillis() / WINDOW_MS;
        String bucketType = isAuth ? "auth" : "general";
        String key = REDIS_KEY_PREFIX + bucketType + ":" + clientIp + ":" + minuteBucket;

        Long count = redisTemplate.opsForValue().increment(key);
        if (count == null) {
            // Should not happen, but treat as allowed
            return new RateLimitResult(true, 1);
        }

        // Set TTL only on first increment (count == 1) to avoid resetting it
        if (count == 1L) {
            redisTemplate.expire(key, REDIS_KEY_TTL);
        }

        // Reset fallback warning flag since Redis is working
        redisFallbackWarned.set(false);

        boolean allowed = count <= limit;
        return new RateLimitResult(allowed, count.intValue());
    }

    /**
     * In-memory fallback using the same sliding-window approach as before.
     */
    private RateLimitResult tryAcquireInMemory(String clientIp, boolean isAuth, int limit) {
        ConcurrentHashMap<String, SlidingWindow> buckets = isAuth ? authBuckets : generalBuckets;
        SlidingWindow window = buckets.computeIfAbsent(clientIp, k -> new SlidingWindow());

        boolean allowed = window.tryAcquire(limit);
        int currentCount = window.getCount();
        return new RateLimitResult(allowed, currentCount);
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
     * Periodically clean up expired in-memory windows (called by scheduler).
     */
    public void cleanup() {
        long now = System.currentTimeMillis();
        generalBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > WINDOW_MS * 2);
        authBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > WINDOW_MS * 2);
    }

    // --- Inner types ---

    private record RateLimitResult(boolean allowed, int currentCount) {}

    /**
     * Simple sliding-window counter for in-memory fallback.
     * Resets the counter when the current time falls outside the previous window.
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
