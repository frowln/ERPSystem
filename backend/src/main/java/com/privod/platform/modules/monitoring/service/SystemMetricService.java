package com.privod.platform.modules.monitoring.service;

import com.privod.platform.modules.monitoring.domain.SystemMetric;
import com.privod.platform.modules.monitoring.repository.SystemMetricRepository;
import com.privod.platform.modules.monitoring.web.dto.DashboardMetricsResponse;
import com.privod.platform.modules.monitoring.web.dto.RecordMetricRequest;
import com.privod.platform.modules.monitoring.web.dto.SystemMetricResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemMetricService {

    private final SystemMetricRepository metricRepository;

    @Transactional
    public SystemMetricResponse record(RecordMetricRequest request) {
        SystemMetric metric = SystemMetric.builder()
                .metricName(request.metricName())
                .metricValue(request.metricValue())
                .metricUnit(request.metricUnit())
                .tags(request.tags())
                .recordedAt(Instant.now())
                .build();

        metric = metricRepository.save(metric);
        log.debug("Metric recorded: {}={}{}", request.metricName(), request.metricValue(),
                request.metricUnit() != null ? " " + request.metricUnit() : "");
        return SystemMetricResponse.fromEntity(metric);
    }

    @Transactional(readOnly = true)
    public List<SystemMetricResponse> getMetrics(String name, Instant from, Instant to) {
        return metricRepository.findByNameAndDateRange(name, from, to)
                .stream()
                .map(SystemMetricResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics() {
        List<SystemMetricResponse> latest = metricRepository.findLatestForAllMetrics()
                .stream()
                .map(SystemMetricResponse::fromEntity)
                .toList();

        List<String> metricNames = metricRepository.findDistinctMetricNames();

        return new DashboardMetricsResponse(latest, metricNames);
    }
}
