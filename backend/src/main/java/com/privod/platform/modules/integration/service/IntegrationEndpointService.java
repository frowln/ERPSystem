package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import com.privod.platform.modules.integration.repository.IntegrationEndpointRepository;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateIntegrationEndpointRequest;
import com.privod.platform.modules.integration.web.dto.IntegrationEndpointResponse;
import com.privod.platform.modules.integration.web.dto.UpdateIntegrationEndpointRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationEndpointService {

    private final IntegrationEndpointRepository endpointRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<IntegrationEndpointResponse> findAll(Pageable pageable) {
        return endpointRepository.findByDeletedFalse(pageable)
                .map(IntegrationEndpointResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IntegrationEndpointResponse findById(UUID id) {
        IntegrationEndpoint endpoint = getEndpointOrThrow(id);
        return IntegrationEndpointResponse.fromEntity(endpoint);
    }

    @Transactional(readOnly = true)
    public List<IntegrationEndpointResponse> findByProvider(IntegrationProvider provider) {
        return endpointRepository.findByProviderAndDeletedFalse(provider).stream()
                .map(IntegrationEndpointResponse::fromEntity)
                .toList();
    }

    @Transactional
    public IntegrationEndpointResponse create(CreateIntegrationEndpointRequest request) {
        if (endpointRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Точка интеграции с кодом '" + request.code() + "' уже существует");
        }

        IntegrationEndpoint endpoint = IntegrationEndpoint.builder()
                .code(request.code())
                .name(request.name())
                .provider(request.provider())
                .baseUrl(request.baseUrl())
                .authType(request.authType())
                .credentials(request.credentials())
                .isActive(request.isActive() != null ? request.isActive() : true)
                .rateLimitPerMinute(request.rateLimitPerMinute() != null ? request.rateLimitPerMinute() : 60)
                .timeoutMs(request.timeoutMs() != null ? request.timeoutMs() : 30000)
                .healthStatus(HealthStatus.DOWN)
                .build();

        endpoint = endpointRepository.save(endpoint);
        auditService.logCreate("IntegrationEndpoint", endpoint.getId());

        log.info("Точка интеграции создана: {} - {} ({})", endpoint.getCode(), endpoint.getName(), endpoint.getId());
        return IntegrationEndpointResponse.fromEntity(endpoint);
    }

    @Transactional
    public IntegrationEndpointResponse update(UUID id, UpdateIntegrationEndpointRequest request) {
        IntegrationEndpoint endpoint = getEndpointOrThrow(id);

        if (request.name() != null) {
            endpoint.setName(request.name());
        }
        if (request.provider() != null) {
            endpoint.setProvider(request.provider());
        }
        if (request.baseUrl() != null) {
            endpoint.setBaseUrl(request.baseUrl());
        }
        if (request.authType() != null) {
            endpoint.setAuthType(request.authType());
        }
        if (request.credentials() != null) {
            endpoint.setCredentials(request.credentials());
        }
        if (request.isActive() != null) {
            endpoint.setActive(request.isActive());
        }
        if (request.rateLimitPerMinute() != null) {
            endpoint.setRateLimitPerMinute(request.rateLimitPerMinute());
        }
        if (request.timeoutMs() != null) {
            endpoint.setTimeoutMs(request.timeoutMs());
        }

        endpoint = endpointRepository.save(endpoint);
        auditService.logUpdate("IntegrationEndpoint", endpoint.getId(), "multiple", null, null);

        log.info("Точка интеграции обновлена: {} ({})", endpoint.getCode(), endpoint.getId());
        return IntegrationEndpointResponse.fromEntity(endpoint);
    }

    @Transactional
    public void delete(UUID id) {
        IntegrationEndpoint endpoint = getEndpointOrThrow(id);
        endpoint.softDelete();
        endpointRepository.save(endpoint);
        auditService.logDelete("IntegrationEndpoint", id);
        log.info("Точка интеграции удалена: {} ({})", endpoint.getCode(), id);
    }

    @Transactional
    public ConnectionTestResponse testConnection(UUID id) {
        IntegrationEndpoint endpoint = getEndpointOrThrow(id);
        long startTime = System.currentTimeMillis();

        try {
            // Simulate connection test - in production, this would make an actual HTTP call
            // to the endpoint's base URL with the configured auth
            boolean reachable = endpoint.getBaseUrl() != null && !endpoint.getBaseUrl().isBlank();
            long responseTime = System.currentTimeMillis() - startTime;

            HealthStatus status = reachable ? HealthStatus.HEALTHY : HealthStatus.DOWN;
            String message = reachable ? "Соединение установлено успешно" : "Не удалось установить соединение";

            endpoint.setHealthStatus(status);
            endpoint.setLastHealthCheck(Instant.now());
            endpointRepository.save(endpoint);

            log.info("Тест соединения для {}: {} ({}мс)", endpoint.getCode(), status, responseTime);

            return new ConnectionTestResponse(
                    reachable,
                    status,
                    status.getDisplayName(),
                    message,
                    responseTime,
                    Instant.now()
            );
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            endpoint.setHealthStatus(HealthStatus.DOWN);
            endpoint.setLastHealthCheck(Instant.now());
            endpointRepository.save(endpoint);

            log.error("Ошибка теста соединения для {}: {}", endpoint.getCode(), e.getMessage());

            return new ConnectionTestResponse(
                    false,
                    HealthStatus.DOWN,
                    HealthStatus.DOWN.getDisplayName(),
                    "Ошибка соединения: " + e.getMessage(),
                    responseTime,
                    Instant.now()
            );
        }
    }

    @Transactional
    public ConnectionTestResponse healthCheck(UUID id) {
        return testConnection(id);
    }

    IntegrationEndpoint getEndpointOrThrow(UUID id) {
        return endpointRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Точка интеграции не найдена: " + id));
    }
}
