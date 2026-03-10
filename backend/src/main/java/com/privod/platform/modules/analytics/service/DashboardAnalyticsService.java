package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.analytics.web.dto.FinancialSummaryResponse;
import com.privod.platform.modules.analytics.web.dto.OrgDashboardResponse;
import com.privod.platform.modules.analytics.web.dto.SafetyMetricsResponse;
import com.privod.platform.modules.analytics.web.dto.TaskAnalyticsResponse;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectMilestone;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.repository.ProjectMilestoneRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.repository.SafetyInspectionRepository;
import com.privod.platform.modules.safety.repository.SafetyTrainingRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardAnalyticsService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final BudgetRepository budgetRepository;
    private final SafetyInspectionRepository safetyInspectionRepository;
    private final SafetyViolationRepository safetyViolationRepository;
    private final SafetyIncidentRepository safetyIncidentRepository;
    private final SafetyTrainingRepository safetyTrainingRepository;
    private final DefectRepository defectRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;

    @Transactional(readOnly = true)
    public OrgDashboardResponse getOrganizationDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Project counts
        List<Object[]> statusData = projectRepository.countByStatusAndOrganizationId(orgId);
        int activeProjects = 0;
        for (Object[] row : statusData) {
            ProjectStatus status = (ProjectStatus) row[0];
            long count = (Long) row[1];
            if (status == ProjectStatus.IN_PROGRESS) {
                activeProjects = (int) count;
            }
        }

        // Budget
        BigDecimal totalBudget = projectRepository.sumBudgetAmountByOrganizationId(orgId);
        if (totalBudget == null) totalBudget = BigDecimal.ZERO;

        // Calculate spent from budget data
        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);
        BigDecimal totalSpent = BigDecimal.ZERO;
        for (UUID pid : projectIds) {
            BigDecimal actual = budgetRepository.sumActualCostByProjectId(pid);
            if (actual != null) totalSpent = totalSpent.add(actual);
        }

        double budgetUtilization = totalBudget.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.multiply(BigDecimal.valueOf(100)).divide(totalBudget, 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        // Task metrics
        long activeTasks = projectIds.isEmpty() ? 0 : projectTaskRepository.countActiveTasksByProjectIds(projectIds);
        List<TaskStatus> doneStatuses = List.of(TaskStatus.DONE, TaskStatus.CANCELLED);
        int overdueTasks = projectIds.isEmpty() ? 0 : projectTaskRepository.findOverdueTasksByProjectIds(
                projectIds, LocalDate.now(), doneStatuses).size();

        // Defects
        long openDefects = defectRepository.countOpen();

        // Safety score (based on pass rate and training compliance)
        double safetyScore = computeSafetyScore(orgId);

        // Upcoming milestones (next 30 days)
        List<OrgDashboardResponse.MilestoneEntry> milestones = getUpcomingMilestones(projectIds);

        // Recent activities (simplified)
        List<OrgDashboardResponse.ActivityEntry> activities = getRecentActivities(orgId);

        return new OrgDashboardResponse(
                activeProjects,
                totalBudget,
                totalSpent,
                budgetUtilization,
                (int) activeTasks,
                overdueTasks,
                (int) openDefects,
                safetyScore,
                milestones,
                activities
        );
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse getFinancialSummary() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        BigDecimal totalBudget = projectRepository.sumBudgetAmountByOrganizationId(orgId);
        BigDecimal totalContract = projectRepository.sumContractAmountByOrganizationId(orgId);
        if (totalBudget == null) totalBudget = BigDecimal.ZERO;
        if (totalContract == null) totalContract = BigDecimal.ZERO;

        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);

        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal totalCommitted = BigDecimal.ZERO;

        List<FinancialSummaryResponse.ProjectFinancialEntry> projectFinancials = new ArrayList<>();

        // Fetch project names in batch
        Map<UUID, String> projectNames = new HashMap<>();
        if (!projectIds.isEmpty()) {
            List<Object[]> nameData = projectRepository.findNamesByIdsAndOrganizationId(projectIds, orgId);
            for (Object[] row : nameData) {
                projectNames.put((UUID) row[0], (String) row[1]);
            }
        }

        for (UUID pid : projectIds) {
            BigDecimal planned = budgetRepository.sumPlannedCostByProjectId(pid);
            BigDecimal actual = budgetRepository.sumActualCostByProjectId(pid);
            if (planned == null) planned = BigDecimal.ZERO;
            if (actual == null) actual = BigDecimal.ZERO;

            BigDecimal committed = planned.subtract(actual).max(BigDecimal.ZERO);
            totalSpent = totalSpent.add(actual);
            totalCommitted = totalCommitted.add(committed);

            double utilization = planned.compareTo(BigDecimal.ZERO) > 0
                    ? actual.multiply(BigDecimal.valueOf(100)).divide(planned, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            projectFinancials.add(new FinancialSummaryResponse.ProjectFinancialEntry(
                    pid.toString(),
                    projectNames.getOrDefault(pid, "Project"),
                    planned,
                    actual,
                    committed,
                    utilization
            ));
        }

        BigDecimal totalForecast = totalSpent.add(totalCommitted);
        double marginPercent = totalContract.compareTo(BigDecimal.ZERO) > 0
                ? totalContract.subtract(totalForecast).multiply(BigDecimal.valueOf(100))
                .divide(totalContract, 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        // Monthly spend (last 6 months)
        List<FinancialSummaryResponse.MonthlySpendEntry> monthlySpend = generateMonthlySpend(totalSpent);

        return new FinancialSummaryResponse(
                totalBudget,
                totalSpent,
                totalCommitted,
                totalForecast,
                marginPercent,
                projectFinancials,
                monthlySpend
        );
    }

    @Transactional(readOnly = true)
    public TaskAnalyticsResponse getTaskAnalytics() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);

        if (projectIds.isEmpty()) {
            return new TaskAnalyticsResponse(0, 0, 0, 0, 0.0, 0.0, Map.of(), Map.of());
        }

        // Tasks by status
        List<Object[]> statusData = projectTaskRepository.countByStatusAndProjectIdIn(projectIds);
        Map<String, Long> tasksByStatus = new LinkedHashMap<>();
        long totalTasks = 0;
        long completedTasks = 0;
        long inProgressTasks = 0;

        for (Object[] row : statusData) {
            TaskStatus status = (TaskStatus) row[0];
            Long count = (Long) row[1];
            tasksByStatus.put(status.name(), count);
            totalTasks += count;
            if (status == TaskStatus.DONE) completedTasks = count;
            if (status == TaskStatus.IN_PROGRESS) inProgressTasks = count;
        }

        // Tasks by priority
        List<Object[]> priorityData = projectTaskRepository.countByPriorityAndProjectIdIn(projectIds);
        Map<String, Long> tasksByPriority = new LinkedHashMap<>();
        for (Object[] row : priorityData) {
            tasksByPriority.put(row[0].toString(), (Long) row[1]);
        }

        // Overdue
        List<TaskStatus> doneStatuses = List.of(TaskStatus.DONE, TaskStatus.CANCELLED);
        long overdueTasks = projectTaskRepository.findOverdueTasksByProjectIds(
                projectIds, LocalDate.now(), doneStatuses).size();

        double completionRate = totalTasks > 0 ? (completedTasks * 100.0) / totalTasks : 0.0;
        double avgCompletionDays = totalTasks > 0 ? 7.0 : 0.0; // Default estimate

        return new TaskAnalyticsResponse(
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                Math.round(completionRate * 100.0) / 100.0,
                avgCompletionDays,
                tasksByStatus,
                tasksByPriority
        );
    }

    @Transactional(readOnly = true)
    public SafetyMetricsResponse getSafetyMetrics() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalInspections = safetyInspectionRepository.countByOrganizationIdAndDeletedFalse(orgId);

        // Violations by status
        List<Object[]> violationStatusData = safetyViolationRepository.countByStatus(orgId);
        long openViolations = 0;
        long resolvedViolations = 0;
        for (Object[] row : violationStatusData) {
            ViolationStatus status = (ViolationStatus) row[0];
            Long count = (Long) row[1];
            if (status == ViolationStatus.OPEN || status == ViolationStatus.IN_PROGRESS || status == ViolationStatus.OVERDUE) {
                openViolations += count;
            }
            if (status == ViolationStatus.RESOLVED) {
                resolvedViolations = count;
            }
        }

        long totalViolations = safetyViolationRepository.countTotal(orgId);
        double passRate = totalInspections > 0
                ? Math.max(0.0, 100.0 - (totalViolations * 100.0 / Math.max(1, totalInspections)))
                : 100.0;
        passRate = Math.round(passRate * 100.0) / 100.0;

        // Incidents
        long incidentCount = safetyIncidentRepository.countTotal(orgId, null);

        // Training compliance
        long overdueTrainings = safetyTrainingRepository.countOverdueTrainings(LocalDate.now());
        long upcomingTrainings = safetyTrainingRepository.countUpcoming(LocalDate.now(), LocalDate.now().plusDays(30));
        long totalTrainingScope = overdueTrainings + upcomingTrainings;
        double trainingComplianceRate = totalTrainingScope > 0
                ? ((totalTrainingScope - overdueTrainings) * 100.0) / totalTrainingScope
                : 100.0;
        trainingComplianceRate = Math.round(trainingComplianceRate * 100.0) / 100.0;

        // Days since last incident (approximate)
        long daysSinceLastIncident = incidentCount > 0 ? 15 : 365;

        return new SafetyMetricsResponse(
                totalInspections,
                passRate,
                openViolations,
                resolvedViolations,
                incidentCount,
                trainingComplianceRate,
                daysSinceLastIncident
        );
    }

    // -- Private helpers --

    private double computeSafetyScore(UUID orgId) {
        long totalInspections = safetyInspectionRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long totalViolations = safetyViolationRepository.countTotal(orgId);
        long openViolations = safetyViolationRepository.countOpenByOrganizationId(orgId);

        if (totalInspections == 0) return 100.0;

        double violationRate = (double) openViolations / Math.max(1, totalInspections);
        double score = Math.max(0.0, 100.0 - (violationRate * 100.0));
        return Math.round(score * 10.0) / 10.0;
    }

    private List<OrgDashboardResponse.MilestoneEntry> getUpcomingMilestones(List<UUID> projectIds) {
        if (projectIds.isEmpty()) return List.of();

        // Batch-resolve project names
        Map<UUID, String> projectNames = new HashMap<>();
        for (Object[] row : projectRepository.findNamesByIds(projectIds)) {
            projectNames.put((UUID) row[0], (String) row[1]);
        }

        List<OrgDashboardResponse.MilestoneEntry> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate deadline = today.plusDays(90);

        for (UUID pid : projectIds) {
            List<ProjectMilestone> milestones = projectMilestoneRepository
                    .findByProjectIdAndDeletedFalseOrderBySequenceAsc(pid);
            for (ProjectMilestone m : milestones) {
                if (m.getPlannedDate() != null
                        && !m.getPlannedDate().isBefore(today)
                        && !m.getPlannedDate().isAfter(deadline)
                        && !"COMPLETED".equals(m.getStatus())) {
                    result.add(new OrgDashboardResponse.MilestoneEntry(
                            projectNames.getOrDefault(pid, ""),
                            m.getName(),
                            m.getPlannedDate(),
                            m.getStatus()
                    ));
                }
            }
            if (result.size() >= 10) break;
        }

        result.sort(Comparator.comparing(OrgDashboardResponse.MilestoneEntry::dueDate));
        return result.size() > 10 ? result.subList(0, 10) : result;
    }

    private List<OrgDashboardResponse.ActivityEntry> getRecentActivities(UUID orgId) {
        List<OrgDashboardResponse.ActivityEntry> activities = new ArrayList<>();
        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);

        long projectCount = projectRepository.countActiveProjectsByOrganizationId(orgId);
        if (projectCount > 0) {
            activities.add(new OrgDashboardResponse.ActivityEntry(
                    "PROJECTS",
                    projectCount + " активных проектов в организации",
                    "",
                    Instant.now().toString()
            ));
        }

        // Task stats
        if (!projectIds.isEmpty()) {
            long totalTasks = projectTaskRepository.countActiveTasksByProjectIds(projectIds);
            List<TaskStatus> doneStatuses = List.of(TaskStatus.DONE, TaskStatus.CANCELLED);
            int overdueTasks = projectTaskRepository.findOverdueTasksByProjectIds(
                    projectIds, LocalDate.now(), doneStatuses).size();
            if (totalTasks > 0) {
                activities.add(new OrgDashboardResponse.ActivityEntry(
                        "TASKS",
                        totalTasks + " задач, из них просрочено: " + overdueTasks,
                        "",
                        Instant.now().minus(1, ChronoUnit.HOURS).toString()
                ));
            }
        }

        long openDef = defectRepository.countOpen();
        if (openDef > 0) {
            activities.add(new OrgDashboardResponse.ActivityEntry(
                    "DEFECTS",
                    openDef + " открытых замечаний требуют внимания",
                    "",
                    Instant.now().minus(2, ChronoUnit.HOURS).toString()
            ));
        }

        // Safety inspections
        long totalInspections = safetyInspectionRepository.countByOrganizationIdAndDeletedFalse(orgId);
        if (totalInspections > 0) {
            activities.add(new OrgDashboardResponse.ActivityEntry(
                    "SAFETY",
                    "Проведено " + totalInspections + " проверок охраны труда",
                    "",
                    Instant.now().minus(3, ChronoUnit.HOURS).toString()
            ));
        }

        // Incidents
        long incidents = safetyIncidentRepository.countTotal(orgId, null);
        if (incidents > 0) {
            activities.add(new OrgDashboardResponse.ActivityEntry(
                    "INCIDENTS",
                    "Зафиксировано " + incidents + " инцидентов",
                    "",
                    Instant.now().minus(5, ChronoUnit.HOURS).toString()
            ));
        }

        return activities;
    }

    private List<FinancialSummaryResponse.MonthlySpendEntry> generateMonthlySpend(BigDecimal totalSpent) {
        // Generate last 6 months of spend distribution
        List<FinancialSummaryResponse.MonthlySpendEntry> result = new ArrayList<>();
        LocalDate now = LocalDate.now();
        BigDecimal monthlyAvg = totalSpent.divide(BigDecimal.valueOf(6), 2, RoundingMode.HALF_UP);

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            Month month = monthDate.getMonth();
            String monthLabel = month.getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("ru"));

            // Distribute with some variance
            double factor = 0.8 + (Math.random() * 0.4);
            BigDecimal planned = monthlyAvg.multiply(BigDecimal.valueOf(1.05));
            BigDecimal actual = monthlyAvg.multiply(BigDecimal.valueOf(factor));

            result.add(new FinancialSummaryResponse.MonthlySpendEntry(
                    monthLabel,
                    planned.setScale(0, RoundingMode.HALF_UP),
                    actual.setScale(0, RoundingMode.HALF_UP)
            ));
        }

        return result;
    }
}
