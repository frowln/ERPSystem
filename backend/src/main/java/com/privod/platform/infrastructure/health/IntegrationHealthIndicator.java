package com.privod.platform.infrastructure.health;

import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.sms.repository.SmsConfigRepository;
import com.privod.platform.modules.integration.webdav.repository.WebDavConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Custom health indicator for external integrations (1C, SMS, WebDAV).
 * Reports status of each integration's configuration.
 */
@Component("integrations")
@RequiredArgsConstructor
@Slf4j
public class IntegrationHealthIndicator implements HealthIndicator {

    private final OneCConfigRepository oneCConfigRepository;
    private final SmsConfigRepository smsConfigRepository;
    private final WebDavConfigRepository webDavConfigRepository;

    @Override
    public Health health() {
        Health.Builder builder = Health.up();

        try {
            // 1C Integration
            long activeOneCConfigs = oneCConfigRepository.findAll().stream()
                    .filter(c -> !c.isDeleted() && c.isActive())
                    .count();
            builder.withDetail("1c.configured", activeOneCConfigs > 0);
            builder.withDetail("1c.activeConfigs", activeOneCConfigs);

            // SMS
            boolean smsEnabled = smsConfigRepository.findByEnabledTrueAndDeletedFalse().isPresent();
            builder.withDetail("sms.configured", smsEnabled);

            // WebDAV
            long webDavConfigs = webDavConfigRepository.findAll().stream()
                    .filter(c -> !c.isDeleted())
                    .count();
            builder.withDetail("webdav.configured", webDavConfigs > 0);
            builder.withDetail("webdav.configCount", webDavConfigs);

        } catch (Exception e) {
            log.error("Ошибка проверки здоровья интеграций: {}", e.getMessage());
            builder.down().withException(e);
        }

        return builder.build();
    }
}
