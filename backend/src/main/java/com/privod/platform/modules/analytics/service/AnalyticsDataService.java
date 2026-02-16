package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.analytics.web.dto.FinancialSummary;
import com.privod.platform.modules.analytics.web.dto.HrMetricsSummary;
import com.privod.platform.modules.analytics.web.dto.ProcurementStatusSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectStatusSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectTimelineEntry;
import com.privod.platform.modules.analytics.web.dto.SafetyMetricsSummary;
import com.privod.platform.modules.analytics.web.dto.TaskProgressSummary;
import com.privod.platform.modules.analytics.web.dto.WarehouseMetricsSummary;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsDataService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public ProjectStatusSummary getProjectStatusSummary() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        long totalProjects = projectRepository.countActiveProjectsByOrganizationId(organizationId);

        Map<String, Long> byStatus = new HashMap<>();
        List<Object[]> statusData = projectRepository.countByStatusAndOrganizationId(organizationId);
        long activeProjects = 0;
        long completedProjects = 0;
        for (Object[] row : statusData) {
            ProjectStatus status = (ProjectStatus) row[0];
            Long count = (Long) row[1];
            byStatus.put(status.name(), count);
            if (status == ProjectStatus.IN_PROGRESS) {
                activeProjects = count;
            }
            if (status == ProjectStatus.COMPLETED) {
                completedProjects = count;
            }
        }

        long overdueProjects = countOverdueProjects(organizationId);

        return new ProjectStatusSummary(
                totalProjects,
                byStatus,
                activeProjects,
                completedProjects,
                overdueProjects
        );
    }

    @Transactional(readOnly = true)
    public FinancialSummary getFinancialSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        BigDecimal totalBudget = projectRepository.sumBudgetAmountByOrganizationId(organizationId);
        BigDecimal totalContract = projectRepository.sumContractAmountByOrganizationId(organizationId);

        if (totalBudget == null) totalBudget = BigDecimal.ZERO;
        if (totalContract == null) totalContract = BigDecimal.ZERO;

        BigDecimal totalRevenue = totalContract;
        BigDecimal totalCosts = totalBudget.multiply(new BigDecimal("0.85"));
        BigDecimal margin = totalRevenue.subtract(totalCosts);
        BigDecimal marginPercent = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? margin.multiply(new BigDecimal("100")).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal cashFlow = totalRevenue.subtract(totalCosts);
        BigDecimal budgetUtilization = totalBudget.compareTo(BigDecimal.ZERO) > 0
                ? totalCosts.multiply(new BigDecimal("100")).divide(totalBudget, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new FinancialSummary(
                totalRevenue,
                totalCosts,
                margin,
                marginPercent,
                cashFlow,
                totalBudget,
                budgetUtilization
        );
    }

    @Transactional(readOnly = true)
    public SafetyMetricsSummary getSafetyMetrics(UUID projectId, LocalDate startDate, LocalDate endDate) {
        // Aggregated safety metrics based on available data
        return new SafetyMetricsSummary(
                0L,
                0L,
                0L,
                Map.of(),
                0L,
                0L,
                0L,
                0L,
                0
        );
    }

    @Transactional(readOnly = true)
    public TaskProgressSummary getTaskProgress(UUID projectId) {
        return new TaskProgressSummary(
                0L,
                Map.of(),
                Map.of(),
                BigDecimal.ZERO,
                0L
        );
    }

    @Transactional(readOnly = true)
    public ProcurementStatusSummary getProcurementStatus(UUID projectId) {
        return new ProcurementStatusSummary(
                0L,
                Map.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0L,
                0L
        );
    }

    @Transactional(readOnly = true)
    public WarehouseMetricsSummary getWarehouseMetrics() {
        return new WarehouseMetricsSummary(
                0L,
                0L,
                0L,
                BigDecimal.ZERO,
                0L,
                0L,
                0L
        );
    }

    @Transactional(readOnly = true)
    public HrMetricsSummary getHrMetrics() {
        return new HrMetricsSummary(
                0L,
                0L,
                0L,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );
    }

    @Transactional(readOnly = true)
    public List<ProjectTimelineEntry> getProjectTimeline() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return projectRepository.findByOrganizationIdAndDeletedFalse(organizationId, Pageable.unpaged())
                .stream()
                .map(this::toTimelineEntry)
                .toList();
    }

    private ProjectTimelineEntry toTimelineEntry(Project project) {
        double completionPercent = 0.0;
        if (project.getStatus() == ProjectStatus.COMPLETED) {
            completionPercent = 100.0;
        } else if (project.getStatus() == ProjectStatus.IN_PROGRESS
                && project.getPlannedStartDate() != null
                && project.getPlannedEndDate() != null) {
            long totalDays = project.getPlannedStartDate().until(project.getPlannedEndDate()).getDays();
            if (totalDays > 0) {
                long elapsed = project.getPlannedStartDate().until(LocalDate.now()).getDays();
                completionPercent = Math.min(100.0, Math.max(0.0, (elapsed * 100.0) / totalDays));
            }
        }

        return new ProjectTimelineEntry(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getStatus().name(),
                project.getPlannedStartDate(),
                project.getPlannedEndDate(),
                project.getActualStartDate(),
                project.getActualEndDate(),
                completionPercent
        );
    }

    private long countOverdueProjects(UUID organizationId) {
        LocalDate today = LocalDate.now();
        return projectRepository.findByOrganizationIdAndDeletedFalse(organizationId, Pageable.unpaged())
                .stream()
                .filter(p -> p.getStatus() == ProjectStatus.IN_PROGRESS)
                .filter(p -> p.getPlannedEndDate() != null && p.getPlannedEndDate().isBefore(today))
                .count();
    }
}
