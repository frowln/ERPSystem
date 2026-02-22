package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.apiManagement.domain.ApiRateLimit;
import com.privod.platform.modules.apiManagement.repository.ApiRateLimitRepository;
import com.privod.platform.modules.apiManagement.web.dto.ApiRateLimitResponse;
import com.privod.platform.modules.apiManagement.web.dto.SetRateLimitRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiRateLimitService {

    private final ApiRateLimitRepository rateLimitRepository;
    private final AuditService auditService;

    /**
     * In-memory rate limit counters.
     * Key = apiKeyId, Value = counter state with reset boundaries.
     */
    private final Map<UUID, RateLimitCounter> counters = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public ApiRateLimitResponse getRateLimit(UUID apiKeyId) {
        return rateLimitRepository.findByApiKeyIdAndDeletedFalse(apiKeyId)
                .map(ApiRateLimitResponse::fromEntity)
                .orElse(null);
    }

    @Transactional
    public ApiRateLimitResponse setRateLimit(UUID apiKeyId, SetRateLimitRequest request) {
        ApiRateLimit rateLimit = rateLimitRepository.findByApiKeyIdAndDeletedFalse(apiKeyId)
                .orElse(null);

        if (rateLimit == null) {
            rateLimit = ApiRateLimit.builder()
                    .apiKeyId(apiKeyId)
                    .requestsPerMinute(request.requestsPerMinute() != null ? request.requestsPerMinute() : 60)
                    .requestsPerHour(request.requestsPerHour() != null ? request.requestsPerHour() : 1000)
                    .requestsPerDay(request.requestsPerDay() != null ? request.requestsPerDay() : 10000)
                    .burstLimit(request.burstLimit() != null ? request.burstLimit() : 10)
                    .isActive(request.isActive() != null ? request.isActive() : true)
                    .build();

            rateLimit = rateLimitRepository.save(rateLimit);
            auditService.logCreate("ApiRateLimit", rateLimit.getId());
            log.info("Rate limit created for API key: {} (rpm={}, rph={}, rpd={})",
                    apiKeyId, rateLimit.getRequestsPerMinute(),
                    rateLimit.getRequestsPerHour(), rateLimit.getRequestsPerDay());
        } else {
            if (request.requestsPerMinute() != null) {
                rateLimit.setRequestsPerMinute(request.requestsPerMinute());
            }
            if (request.requestsPerHour() != null) {
                rateLimit.setRequestsPerHour(request.requestsPerHour());
            }
            if (request.requestsPerDay() != null) {
                rateLimit.setRequestsPerDay(request.requestsPerDay());
            }
            if (request.burstLimit() != null) {
                rateLimit.setBurstLimit(request.burstLimit());
            }
            if (request.isActive() != null) {
                rateLimit.setActive(request.isActive());
            }

            rateLimit = rateLimitRepository.save(rateLimit);
            auditService.logUpdate("ApiRateLimit", rateLimit.getId(), "multiple", null, null);
            log.info("Rate limit updated for API key: {} (rpm={}, rph={}, rpd={})",
                    apiKeyId, rateLimit.getRequestsPerMinute(),
                    rateLimit.getRequestsPerHour(), rateLimit.getRequestsPerDay());

            // Reset in-memory counter on config change
            counters.remove(apiKeyId);
        }

        return ApiRateLimitResponse.fromEntity(rateLimit);
    }

    /**
     * Check if the given API key is currently rate-limited.
     * Uses in-memory counters with automatic reset on minute boundaries.
     */
    public boolean isRateLimited(UUID apiKeyId) {
        ApiRateLimit config = rateLimitRepository.findByApiKeyIdAndIsActiveTrueAndDeletedFalse(apiKeyId)
                .orElse(null);

        if (config == null) {
            return false;
        }

        RateLimitCounter counter = counters.computeIfAbsent(apiKeyId, k -> new RateLimitCounter());
        long now = System.currentTimeMillis();

        // Reset minute counter if a new minute has started
        long currentMinute = now / 60_000;
        if (counter.lastMinuteReset.get() != currentMinute) {
            counter.minuteCount.set(0);
            counter.lastMinuteReset.set(currentMinute);
        }

        // Reset hour counter if a new hour has started
        long currentHour = now / 3_600_000;
        if (counter.lastHourReset.get() != currentHour) {
            counter.hourCount.set(0);
            counter.lastHourReset.set(currentHour);
        }

        // Reset day counter if a new day has started
        long currentDay = now / 86_400_000;
        if (counter.lastDayReset.get() != currentDay) {
            counter.dayCount.set(0);
            counter.lastDayReset.set(currentDay);
        }

        // Check limits
        if (counter.minuteCount.get() >= config.getRequestsPerMinute()) {
            log.warn("Rate limit exceeded (per minute) for API key: {}", apiKeyId);
            return true;
        }
        if (counter.hourCount.get() >= config.getRequestsPerHour()) {
            log.warn("Rate limit exceeded (per hour) for API key: {}", apiKeyId);
            return true;
        }
        if (counter.dayCount.get() >= config.getRequestsPerDay()) {
            log.warn("Rate limit exceeded (per day) for API key: {}", apiKeyId);
            return true;
        }

        // Increment counters
        counter.minuteCount.incrementAndGet();
        counter.hourCount.incrementAndGet();
        counter.dayCount.incrementAndGet();

        return false;
    }

    private static class RateLimitCounter {
        final AtomicInteger minuteCount = new AtomicInteger(0);
        final AtomicInteger hourCount = new AtomicInteger(0);
        final AtomicInteger dayCount = new AtomicInteger(0);
        final AtomicLong lastMinuteReset = new AtomicLong(System.currentTimeMillis() / 60_000);
        final AtomicLong lastHourReset = new AtomicLong(System.currentTimeMillis() / 3_600_000);
        final AtomicLong lastDayReset = new AtomicLong(System.currentTimeMillis() / 86_400_000);
    }
}
