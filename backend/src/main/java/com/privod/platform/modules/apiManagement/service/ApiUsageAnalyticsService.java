package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.apiManagement.domain.ApiUsageLog;
import com.privod.platform.modules.apiManagement.repository.ApiUsageLogRepository;
import com.privod.platform.modules.apiManagement.web.dto.ApiUsageStatsResponse;
import com.privod.platform.modules.apiManagement.web.dto.TopEndpointResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiUsageAnalyticsService {

    private final ApiUsageLogRepository usageLogRepository;

    @Async
    @Transactional
    public void logRequest(UUID organizationId, UUID apiKeyId, String endpoint, String method,
                           int statusCode, Integer responseTimeMs, Long requestSizeBytes,
                           Long responseSizeBytes, String ipAddress, String userAgent,
                           String errorMessage) {
        ApiUsageLog logEntry = ApiUsageLog.builder()
                .organizationId(organizationId)
                .apiKeyId(apiKeyId)
                .endpoint(endpoint)
                .method(method)
                .statusCode(statusCode)
                .responseTimeMs(responseTimeMs)
                .requestSizeBytes(requestSizeBytes)
                .responseSizeBytes(responseSizeBytes)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .errorMessage(errorMessage)
                .requestedAt(Instant.now())
                .build();

        usageLogRepository.save(logEntry);
        log.debug("API usage logged: {} {} -> {} ({}ms)", method, endpoint, statusCode, responseTimeMs);
    }

    @Transactional(readOnly = true)
    public ApiUsageStatsResponse getUsageStats(UUID apiKeyId, LocalDate from, LocalDate to) {
        Instant fromInstant = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<ApiUsageLog> logs = usageLogRepository.findByApiKeyIdAndDateRange(apiKeyId, fromInstant, toInstant);

        long totalRequests = logs.size();
        long successfulRequests = logs.stream().filter(l -> l.getStatusCode() >= 200 && l.getStatusCode() < 400).count();
        long failedRequests = totalRequests - successfulRequests;

        double avgResponseTime = logs.stream()
                .filter(l -> l.getResponseTimeMs() != null)
                .mapToInt(ApiUsageLog::getResponseTimeMs)
                .average()
                .orElse(0.0);

        long totalRequestSize = logs.stream()
                .filter(l -> l.getRequestSizeBytes() != null)
                .mapToLong(ApiUsageLog::getRequestSizeBytes)
                .sum();

        long totalResponseSize = logs.stream()
                .filter(l -> l.getResponseSizeBytes() != null)
                .mapToLong(ApiUsageLog::getResponseSizeBytes)
                .sum();

        return new ApiUsageStatsResponse(
                apiKeyId,
                from,
                to,
                totalRequests,
                successfulRequests,
                failedRequests,
                avgResponseTime,
                totalRequestSize,
                totalResponseSize
        );
    }

    @Transactional(readOnly = true)
    public List<TopEndpointResponse> getTopEndpoints(UUID orgId, int limit) {
        UUID organizationId = orgId != null ? orgId : SecurityUtils.requireCurrentOrganizationId();
        List<Object[]> results = usageLogRepository.findTopEndpoints(organizationId, PageRequest.of(0, limit));

        return results.stream()
                .map(row -> new TopEndpointResponse(
                        (String) row[0],
                        (Long) row[1]
                ))
                .toList();
    }
}
