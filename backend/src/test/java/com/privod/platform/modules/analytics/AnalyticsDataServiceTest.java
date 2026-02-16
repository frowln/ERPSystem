package com.privod.platform.modules.analytics;

import com.privod.platform.modules.analytics.service.AnalyticsDataService;
import com.privod.platform.modules.analytics.web.dto.FinancialSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectStatusSummary;
import com.privod.platform.modules.analytics.web.dto.ProjectTimelineEntry;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsDataServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private AnalyticsDataService analyticsDataService;

    private Project activeProject;
    private Project completedProject;

    @BeforeEach
    void setUp() {
        activeProject = Project.builder()
                .code("PRJ-00001")
                .name("Active Project")
                .status(ProjectStatus.IN_PROGRESS)
                .plannedStartDate(LocalDate.of(2025, 1, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .budgetAmount(new BigDecimal("10000000.00"))
                .contractAmount(new BigDecimal("12000000.00"))
                .type(ProjectType.COMMERCIAL)
                .priority(ProjectPriority.HIGH)
                .build();
        activeProject.setId(UUID.randomUUID());

        completedProject = Project.builder()
                .code("PRJ-00002")
                .name("Completed Project")
                .status(ProjectStatus.COMPLETED)
                .plannedStartDate(LocalDate.of(2024, 1, 1))
                .plannedEndDate(LocalDate.of(2024, 12, 31))
                .actualStartDate(LocalDate.of(2024, 1, 15))
                .actualEndDate(LocalDate.of(2024, 11, 30))
                .budgetAmount(new BigDecimal("5000000.00"))
                .contractAmount(new BigDecimal("6000000.00"))
                .type(ProjectType.RESIDENTIAL)
                .priority(ProjectPriority.NORMAL)
                .build();
        completedProject.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should return project status summary with counts by status")
    void getProjectStatusSummary_ReturnsCounts() {
        when(projectRepository.countActiveProjects()).thenReturn(5L);
        when(projectRepository.countByStatus()).thenReturn(List.of(
                new Object[]{ProjectStatus.DRAFT, 1L},
                new Object[]{ProjectStatus.IN_PROGRESS, 3L},
                new Object[]{ProjectStatus.COMPLETED, 1L}
        ));
        when(projectRepository.findAll()).thenReturn(List.of(activeProject, completedProject));

        ProjectStatusSummary summary = analyticsDataService.getProjectStatusSummary();

        assertThat(summary.totalProjects()).isEqualTo(5);
        assertThat(summary.byStatus()).containsEntry("IN_PROGRESS", 3L);
        assertThat(summary.byStatus()).containsEntry("COMPLETED", 1L);
        assertThat(summary.activeProjects()).isEqualTo(3);
        assertThat(summary.completedProjects()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should return financial summary with margin calculation")
    void getFinancialSummary_CalculatesMargin() {
        when(projectRepository.sumBudgetAmount()).thenReturn(new BigDecimal("15000000.00"));
        when(projectRepository.sumContractAmount()).thenReturn(new BigDecimal("18000000.00"));

        FinancialSummary summary = analyticsDataService.getFinancialSummary(null);

        assertThat(summary.totalRevenue()).isEqualByComparingTo(new BigDecimal("18000000.00"));
        assertThat(summary.totalBudget()).isEqualByComparingTo(new BigDecimal("15000000.00"));
        assertThat(summary.totalCosts()).isEqualByComparingTo(new BigDecimal("12750000.00"));
        assertThat(summary.margin()).isPositive();
        assertThat(summary.marginPercent()).isPositive();
    }

    @Test
    @DisplayName("Should handle null budget/contract amounts gracefully")
    void getFinancialSummary_NullAmounts() {
        when(projectRepository.sumBudgetAmount()).thenReturn(null);
        when(projectRepository.sumContractAmount()).thenReturn(null);

        FinancialSummary summary = analyticsDataService.getFinancialSummary(null);

        assertThat(summary.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.totalBudget()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.totalCosts()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.margin()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should return project timeline entries for all active projects")
    void getProjectTimeline_ReturnsEntries() {
        when(projectRepository.findAll()).thenReturn(List.of(activeProject, completedProject));

        List<ProjectTimelineEntry> timeline = analyticsDataService.getProjectTimeline();

        assertThat(timeline).hasSize(2);

        ProjectTimelineEntry activeEntry = timeline.stream()
                .filter(e -> e.projectCode().equals("PRJ-00001"))
                .findFirst().orElseThrow();
        assertThat(activeEntry.status()).isEqualTo("IN_PROGRESS");
        assertThat(activeEntry.plannedStartDate()).isEqualTo(LocalDate.of(2025, 1, 1));

        ProjectTimelineEntry completedEntry = timeline.stream()
                .filter(e -> e.projectCode().equals("PRJ-00002"))
                .findFirst().orElseThrow();
        assertThat(completedEntry.completionPercent()).isEqualTo(100.0);
    }
}
