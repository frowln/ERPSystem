package com.privod.platform.modules.analytics;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.AggregationType;
import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiDefinition;
import com.privod.platform.modules.analytics.domain.KpiSnapshot;
import com.privod.platform.modules.analytics.domain.KpiTrend;
import com.privod.platform.modules.analytics.domain.KpiUnit;
import com.privod.platform.modules.analytics.repository.KpiDefinitionRepository;
import com.privod.platform.modules.analytics.repository.KpiSnapshotRepository;
import com.privod.platform.modules.analytics.service.KpiService;
import com.privod.platform.modules.analytics.web.dto.CreateKpiDefinitionRequest;
import com.privod.platform.modules.analytics.web.dto.KpiDashboardItem;
import com.privod.platform.modules.analytics.web.dto.KpiDefinitionResponse;
import com.privod.platform.modules.analytics.web.dto.KpiSnapshotResponse;
import com.privod.platform.modules.analytics.web.dto.TakeSnapshotRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KpiServiceTest {

    @Mock
    private KpiDefinitionRepository kpiRepository;

    @Mock
    private KpiSnapshotRepository snapshotRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private KpiService kpiService;

    private UUID kpiId;
    private KpiDefinition testKpi;

    @BeforeEach
    void setUp() {
        kpiId = UUID.randomUUID();
        testKpi = KpiDefinition.builder()
                .code("project_completion_rate")
                .name("Project Completion Rate")
                .description("Percentage of completed projects")
                .category(KpiCategory.PROJECT)
                .dataSource("projects.completionRate")
                .aggregationType(AggregationType.FORMULA)
                .unit(KpiUnit.PERCENT)
                .targetValue(new BigDecimal("95.0"))
                .warningThreshold(new BigDecimal("80.0"))
                .criticalThreshold(new BigDecimal("60.0"))
                .isActive(true)
                .build();
        testKpi.setId(kpiId);
        testKpi.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create KPI Definition")
    class CreateKpiTests {

        @Test
        @DisplayName("Should create KPI definition successfully")
        void create_Success() {
            CreateKpiDefinitionRequest request = new CreateKpiDefinitionRequest(
                    "new_kpi", "New KPI", "Description",
                    KpiCategory.FINANCIAL, "finance.margin",
                    AggregationType.AVG, null, KpiUnit.PERCENT,
                    new BigDecimal("90.0"), new BigDecimal("70.0"), new BigDecimal("50.0"),
                    true);

            when(kpiRepository.existsByCodeAndDeletedFalse("new_kpi")).thenReturn(false);
            when(kpiRepository.save(any(KpiDefinition.class))).thenAnswer(invocation -> {
                KpiDefinition k = invocation.getArgument(0);
                k.setId(UUID.randomUUID());
                k.setCreatedAt(Instant.now());
                return k;
            });

            KpiDefinitionResponse response = kpiService.create(request);

            assertThat(response.code()).isEqualTo("new_kpi");
            assertThat(response.category()).isEqualTo(KpiCategory.FINANCIAL);
            assertThat(response.unit()).isEqualTo(KpiUnit.PERCENT);
            verify(auditService).logCreate(eq("KpiDefinition"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate KPI code")
        void create_DuplicateCode() {
            CreateKpiDefinitionRequest request = new CreateKpiDefinitionRequest(
                    "existing_kpi", "Existing KPI", null,
                    KpiCategory.PROJECT, null, null, null, null,
                    null, null, null, null);

            when(kpiRepository.existsByCodeAndDeletedFalse("existing_kpi")).thenReturn(true);

            assertThatThrownBy(() -> kpiService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("KPI Snapshots")
    class SnapshotTests {

        @Test
        @DisplayName("Should take snapshot with UP trend when value increases")
        void takeSnapshot_TrendUp() {
            KpiSnapshot previousSnapshot = KpiSnapshot.builder()
                    .kpiId(kpiId)
                    .value(new BigDecimal("85.0"))
                    .snapshotDate(LocalDate.now().minusDays(1))
                    .trend(KpiTrend.STABLE)
                    .build();

            when(kpiRepository.findById(kpiId)).thenReturn(Optional.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.of(previousSnapshot));
            when(snapshotRepository.save(any(KpiSnapshot.class))).thenAnswer(invocation -> {
                KpiSnapshot s = invocation.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            TakeSnapshotRequest request = new TakeSnapshotRequest(
                    new BigDecimal("90.0"), null, null, null);

            KpiSnapshotResponse response = kpiService.takeSnapshot(kpiId, request);

            assertThat(response.value()).isEqualByComparingTo(new BigDecimal("90.0"));
            assertThat(response.trend()).isEqualTo(KpiTrend.UP);
        }

        @Test
        @DisplayName("Should take snapshot with DOWN trend when value decreases")
        void takeSnapshot_TrendDown() {
            KpiSnapshot previousSnapshot = KpiSnapshot.builder()
                    .kpiId(kpiId)
                    .value(new BigDecimal("90.0"))
                    .snapshotDate(LocalDate.now().minusDays(1))
                    .trend(KpiTrend.STABLE)
                    .build();

            when(kpiRepository.findById(kpiId)).thenReturn(Optional.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.of(previousSnapshot));
            when(snapshotRepository.save(any(KpiSnapshot.class))).thenAnswer(invocation -> {
                KpiSnapshot s = invocation.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            TakeSnapshotRequest request = new TakeSnapshotRequest(
                    new BigDecimal("75.0"), null, null, null);

            KpiSnapshotResponse response = kpiService.takeSnapshot(kpiId, request);

            assertThat(response.value()).isEqualByComparingTo(new BigDecimal("75.0"));
            assertThat(response.trend()).isEqualTo(KpiTrend.DOWN);
        }

        @Test
        @DisplayName("Should take first snapshot with STABLE trend when no history")
        void takeSnapshot_FirstSnapshot() {
            when(kpiRepository.findById(kpiId)).thenReturn(Optional.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.empty());
            when(snapshotRepository.save(any(KpiSnapshot.class))).thenAnswer(invocation -> {
                KpiSnapshot s = invocation.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            TakeSnapshotRequest request = new TakeSnapshotRequest(
                    new BigDecimal("88.0"), null, null, null);

            KpiSnapshotResponse response = kpiService.takeSnapshot(kpiId, request);

            assertThat(response.trend()).isEqualTo(KpiTrend.STABLE);
            assertThat(response.targetValue()).isEqualByComparingTo(new BigDecimal("95.0"));
        }
    }

    @Nested
    @DisplayName("KPI Dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Should return KPI dashboard with health status")
        void getKpiDashboard_ReturnsItems() {
            KpiSnapshot latestSnapshot = KpiSnapshot.builder()
                    .kpiId(kpiId)
                    .value(new BigDecimal("92.0"))
                    .snapshotDate(LocalDate.now())
                    .trend(KpiTrend.UP)
                    .build();

            when(kpiRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.of(latestSnapshot));

            List<KpiDashboardItem> dashboard = kpiService.getKpiDashboard();

            assertThat(dashboard).hasSize(1);
            KpiDashboardItem item = dashboard.get(0);
            assertThat(item.code()).isEqualTo("project_completion_rate");
            assertThat(item.currentValue()).isEqualByComparingTo(new BigDecimal("92.0"));
            assertThat(item.trend()).isEqualTo(KpiTrend.UP);
            assertThat(item.healthStatus()).isEqualTo("HEALTHY");
        }

        @Test
        @DisplayName("Should return WARNING health status when value is between thresholds")
        void getKpiDashboard_WarningStatus() {
            KpiSnapshot warningSnapshot = KpiSnapshot.builder()
                    .kpiId(kpiId)
                    .value(new BigDecimal("75.0"))
                    .snapshotDate(LocalDate.now())
                    .trend(KpiTrend.DOWN)
                    .build();

            when(kpiRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.of(warningSnapshot));

            List<KpiDashboardItem> dashboard = kpiService.getKpiDashboard();

            assertThat(dashboard.get(0).healthStatus()).isEqualTo("WARNING");
        }

        @Test
        @DisplayName("Should return CRITICAL health status when value is below critical threshold")
        void getKpiDashboard_CriticalStatus() {
            KpiSnapshot criticalSnapshot = KpiSnapshot.builder()
                    .kpiId(kpiId)
                    .value(new BigDecimal("55.0"))
                    .snapshotDate(LocalDate.now())
                    .trend(KpiTrend.DOWN)
                    .build();

            when(kpiRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testKpi));
            when(snapshotRepository.findLatestByKpiId(kpiId)).thenReturn(Optional.of(criticalSnapshot));

            List<KpiDashboardItem> dashboard = kpiService.getKpiDashboard();

            assertThat(dashboard.get(0).healthStatus()).isEqualTo("CRITICAL");
        }
    }

    @Test
    @DisplayName("Should throw when KPI not found")
    void findById_NotFound() {
        UUID nonExistent = UUID.randomUUID();
        when(kpiRepository.findById(nonExistent)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> kpiService.findById(nonExistent))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("не найден");
    }

    @Test
    @DisplayName("Should soft delete KPI")
    void delete_Success() {
        when(kpiRepository.findById(kpiId)).thenReturn(Optional.of(testKpi));
        when(kpiRepository.save(any(KpiDefinition.class))).thenReturn(testKpi);

        kpiService.delete(kpiId);

        assertThat(testKpi.isDeleted()).isTrue();
        verify(auditService).logDelete("KpiDefinition", kpiId);
    }
}
