package com.privod.platform.infrastructure.scheduler;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's scheduled task execution capability.
 * Individual job beans are conditionally activated via
 * {@code app.scheduler.enabled=true} (default).
 */
@Configuration
@EnableScheduling
public class ScheduledJobsConfig {
}
