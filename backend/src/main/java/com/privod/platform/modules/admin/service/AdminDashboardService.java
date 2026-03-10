package com.privod.platform.modules.admin.service;

import com.privod.platform.infrastructure.audit.AuditLog;
import com.privod.platform.infrastructure.audit.AuditLogRepository;
import com.privod.platform.modules.admin.web.dto.DashboardMetricsResponse;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogRepository auditLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getMetrics() {
        long totalUsers = userRepository.count();
        long totalProjects = projectRepository.count();

        Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);
        Page<AuditLog> recentActions = auditLogRepository.findByTimestampBetween(
                last24h, Instant.now(),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp")));

        List<DashboardMetricsResponse.RecentAction> actions = recentActions.getContent().stream()
                .map(a -> new DashboardMetricsResponse.RecentAction(
                        a.getId(),
                        a.getEntityType(),
                        a.getAction().name(),
                        a.getUserName(),
                        a.getTimestamp()
                )).toList();

        long storageUsedMb = 0L;
        try {
            Object result = entityManager.createNativeQuery(
                    "SELECT pg_database_size(current_database()) / (1024 * 1024)").getSingleResult();
            if (result instanceof Number) {
                storageUsedMb = ((Number) result).longValue();
            }
        } catch (Exception e) {
            log.warn("Could not calculate storage size: {}", e.getMessage());
        }

        return new DashboardMetricsResponse(
                totalUsers,
                totalProjects,
                storageUsedMb,
                true, // systemHealthy
                actions
        );
    }
}
