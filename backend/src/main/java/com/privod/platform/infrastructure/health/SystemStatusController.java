package com.privod.platform.infrastructure.health;

import com.privod.platform.infrastructure.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.SystemHealth;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * System status endpoint — exposes aggregated health, uptime, memory, and version info.
 */
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Tag(name = "System", description = "Системный статус и мониторинг")
public class SystemStatusController {

    private final HealthEndpoint healthEndpoint;
    private final Optional<BuildProperties> buildProperties;

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Полный статус системы")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        Map<String, Object> status = new LinkedHashMap<>();

        // Health
        SystemHealth health = (SystemHealth) healthEndpoint.health();
        status.put("health", health.getStatus().getCode());

        // Version
        buildProperties.ifPresent(bp -> {
            status.put("version", bp.getVersion());
            status.put("buildTime", bp.getTime());
            status.put("artifact", bp.getArtifact());
        });

        // JVM
        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();

        long uptimeMs = runtime.getUptime();
        Duration uptime = Duration.ofMillis(uptimeMs);
        status.put("uptime", String.format("%dd %dh %dm %ds",
                uptime.toDays(), uptime.toHoursPart(), uptime.toMinutesPart(), uptime.toSecondsPart()));
        status.put("uptimeMs", uptimeMs);
        status.put("startTime", Instant.ofEpochMilli(runtime.getStartTime()).toString());

        // Memory
        Map<String, Object> memoryInfo = new LinkedHashMap<>();
        long heapUsed = memory.getHeapMemoryUsage().getUsed();
        long heapMax = memory.getHeapMemoryUsage().getMax();
        memoryInfo.put("heapUsedMb", heapUsed / 1024 / 1024);
        memoryInfo.put("heapMaxMb", heapMax / 1024 / 1024);
        memoryInfo.put("heapUsagePercent", heapMax > 0 ? (heapUsed * 100 / heapMax) : 0);
        memoryInfo.put("nonHeapUsedMb", memory.getNonHeapMemoryUsage().getUsed() / 1024 / 1024);
        status.put("memory", memoryInfo);

        // Processors
        status.put("availableProcessors", Runtime.getRuntime().availableProcessors());

        // Java
        status.put("javaVersion", System.getProperty("java.version"));
        status.put("javaVendor", System.getProperty("java.vendor"));

        // Timestamp
        status.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/ping")
    @Operation(summary = "Простая проверка доступности")
    public ResponseEntity<ApiResponse<Map<String, String>>> ping() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "status", "ok",
                "timestamp", Instant.now().toString()
        )));
    }
}
