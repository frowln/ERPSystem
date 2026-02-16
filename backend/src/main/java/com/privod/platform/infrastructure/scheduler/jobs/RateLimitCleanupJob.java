package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically cleans up expired rate-limit buckets to prevent memory leaks.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitCleanupJob {

    private final RateLimitFilter rateLimitFilter;

    @Scheduled(fixedRate = 120_000) // every 2 minutes
    public void cleanup() {
        rateLimitFilter.cleanup();
    }
}
