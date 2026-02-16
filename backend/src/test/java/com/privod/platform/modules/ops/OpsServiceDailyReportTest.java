package com.privod.platform.modules.ops;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.DailyReport;
import com.privod.platform.modules.ops.domain.WeatherImpact;
import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.domain.WorkType;
import com.privod.platform.modules.ops.repository.DailyReportRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.repository.FieldInstructionRepository;
import com.privod.platform.modules.ops.repository.ShiftHandoverRepository;
import com.privod.platform.modules.ops.repository.WeatherRecordRepository;
import com.privod.platform.modules.ops.repository.WorkOrderRepository;
import com.privod.platform.modules.ops.service.OpsService;
import com.privod.platform.modules.ops.web.dto.CreateDailyReportRequest;
import com.privod.platform.modules.ops.web.dto.DailyReportResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class OpsServiceDailyReportTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private DailyReportRepository dailyReportRepository;

    @Mock
    private DefectRepository defectRepository;

    @Mock
    private FieldInstructionRepository fieldInstructionRepository;

    @Mock
    private WeatherRecordRepository weatherRecordRepository;

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OpsService opsService;

    private UUID workOrderId;
    private WorkOrder testWorkOrder;

    @BeforeEach
    void setUp() {
        workOrderId = UUID.randomUUID();

        testWorkOrder = WorkOrder.builder()
                .projectId(UUID.randomUUID())
                .code("НЗ-00001")
                .title("Фундамент")
                .workType(WorkType.FOUNDATION)
                .status(WorkOrderStatus.IN_PROGRESS)
                .priority(WorkOrderPriority.HIGH)
                .build();
        testWorkOrder.setId(workOrderId);
        testWorkOrder.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create daily report for work order")
    void createDailyReport_Success() {
        when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
        when(dailyReportRepository.save(any(DailyReport.class))).thenAnswer(invocation -> {
            DailyReport dr = invocation.getArgument(0);
            dr.setId(UUID.randomUUID());
            dr.setCreatedAt(Instant.now());
            return dr;
        });

        UUID submitterId = UUID.randomUUID();
        CreateDailyReportRequest request = new CreateDailyReportRequest(
                workOrderId, LocalDate.of(2025, 8, 1),
                "Залит фундамент секции 1", "Задержка из-за дождя",
                "{\"cement\": 100, \"sand\": 200}", new BigDecimal("8.50"),
                new BigDecimal("4.00"), WeatherImpact.MINOR, submitterId);

        DailyReportResponse response = opsService.createDailyReport(request);

        assertThat(response.workOrderId()).isEqualTo(workOrderId);
        assertThat(response.workDone()).isEqualTo("Залит фундамент секции 1");
        assertThat(response.laborHours()).isEqualByComparingTo(new BigDecimal("8.50"));
        assertThat(response.weatherImpact()).isEqualTo(WeatherImpact.MINOR);
        assertThat(response.weatherImpactDisplayName()).isEqualTo("Незначительное");
        verify(auditService).logCreate(eq("DailyReport"), any(UUID.class));
    }

    @Test
    @DisplayName("Should fail to create daily report for non-existent work order")
    void createDailyReport_WorkOrderNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(workOrderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        CreateDailyReportRequest request = new CreateDailyReportRequest(
                nonExistentId, LocalDate.now(), "Some work", null,
                null, null, null, null, null);

        assertThatThrownBy(() -> opsService.createDailyReport(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Наряд-задание не найдено");
    }

    @Test
    @DisplayName("Should return daily reports for a work order")
    void getDailyReports_Success() {
        DailyReport dr1 = DailyReport.builder()
                .workOrderId(workOrderId)
                .reportDate(LocalDate.of(2025, 8, 1))
                .workDone("День 1")
                .laborHours(new BigDecimal("8.00"))
                .build();
        dr1.setId(UUID.randomUUID());
        dr1.setCreatedAt(Instant.now());

        DailyReport dr2 = DailyReport.builder()
                .workOrderId(workOrderId)
                .reportDate(LocalDate.of(2025, 8, 2))
                .workDone("День 2")
                .laborHours(new BigDecimal("7.50"))
                .weatherImpact(WeatherImpact.MODERATE)
                .build();
        dr2.setId(UUID.randomUUID());
        dr2.setCreatedAt(Instant.now());

        when(dailyReportRepository.findByWorkOrderIdAndDeletedFalseOrderByReportDateDesc(workOrderId))
                .thenReturn(List.of(dr2, dr1));

        List<DailyReportResponse> reports = opsService.getDailyReportsForWorkOrder(workOrderId);

        assertThat(reports).hasSize(2);
        assertThat(reports.get(0).reportDate()).isEqualTo(LocalDate.of(2025, 8, 2));
        assertThat(reports.get(1).reportDate()).isEqualTo(LocalDate.of(2025, 8, 1));
    }
}
