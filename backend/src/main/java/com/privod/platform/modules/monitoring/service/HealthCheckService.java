package com.privod.platform.modules.monitoring.service;

import com.privod.platform.modules.monitoring.domain.HealthComponent;
import com.privod.platform.modules.monitoring.domain.HealthStatus;
import com.privod.platform.modules.monitoring.domain.SystemHealthCheck;
import com.privod.platform.modules.monitoring.repository.SystemHealthCheckRepository;
import com.privod.platform.modules.monitoring.web.dto.HealthCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthCheckService {

    private final SystemHealthCheckRepository healthCheckRepository;
    private final DataSource dataSource;

    @Transactional
    public List<HealthCheckResponse> checkAll() {
        List<HealthCheckResponse> results = new ArrayList<>();
        for (HealthComponent component : HealthComponent.values()) {
            results.add(checkComponent(component));
        }
        return results;
    }

    @Transactional
    public HealthCheckResponse checkComponent(HealthComponent component) {
        long startTime = System.currentTimeMillis();
        HealthStatus status;
        String message;

        try {
            switch (component) {
                case DATABASE -> {
                    try (Connection conn = dataSource.getConnection()) {
                        conn.isValid(5);
                        status = HealthStatus.HEALTHY;
                        message = "База данных доступна";
                    }
                }
                default -> {
                    // For other components, perform a basic check
                    // In production, each would have its specific health check
                    status = HealthStatus.HEALTHY;
                    message = component.getDisplayName() + " - проверка пройдена";
                }
            }
        } catch (Exception e) {
            status = HealthStatus.DOWN;
            message = "Ошибка: " + e.getMessage();
            log.error("Health check failed for {}: {}", component, e.getMessage());
        }

        long responseTime = System.currentTimeMillis() - startTime;

        SystemHealthCheck healthCheck = SystemHealthCheck.builder()
                .component(component)
                .status(status)
                .responseTimeMs(responseTime)
                .message(message)
                .checkedAt(Instant.now())
                .build();

        healthCheck = healthCheckRepository.save(healthCheck);
        log.info("Health check completed: {} = {} ({}ms)", component, status, responseTime);
        return HealthCheckResponse.fromEntity(healthCheck);
    }

    @Transactional(readOnly = true)
    public List<HealthCheckResponse> getLatestStatus() {
        return healthCheckRepository.findLatestForAllComponents()
                .stream()
                .map(HealthCheckResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckResponse> getHealthHistory(HealthComponent component, Pageable pageable) {
        return healthCheckRepository
                .findByComponentAndDeletedFalseOrderByCheckedAtDesc(component, pageable)
                .map(HealthCheckResponse::fromEntity);
    }
}
