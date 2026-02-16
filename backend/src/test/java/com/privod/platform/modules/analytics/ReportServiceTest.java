package com.privod.platform.modules.analytics;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.ExecutionStatus;
import com.privod.platform.modules.analytics.domain.OutputFormat;
import com.privod.platform.modules.analytics.domain.ReportType;
import com.privod.platform.modules.analytics.domain.RunStatus;
import com.privod.platform.modules.analytics.domain.SavedReport;
import com.privod.platform.modules.analytics.domain.ReportExecution;
import com.privod.platform.modules.analytics.repository.ReportExecutionRepository;
import com.privod.platform.modules.analytics.repository.SavedReportRepository;
import com.privod.platform.modules.analytics.service.ReportService;
import com.privod.platform.modules.analytics.web.dto.CreateReportRequest;
import com.privod.platform.modules.analytics.web.dto.ExecuteReportRequest;
import com.privod.platform.modules.analytics.web.dto.ReportExecutionResponse;
import com.privod.platform.modules.analytics.web.dto.SavedReportResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private SavedReportRepository reportRepository;

    @Mock
    private ReportExecutionRepository executionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ReportService reportService;

    private UUID reportId;
    private SavedReport testReport;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
        testReport = SavedReport.builder()
                .code("RPT-00001")
                .name("Monthly Project Status")
                .description("Monthly status report for all projects")
                .reportType(ReportType.PROJECT_STATUS)
                .outputFormat(OutputFormat.PDF)
                .queryConfig("{\"groupBy\": \"status\"}")
                .scheduleEnabled(false)
                .build();
        testReport.setId(reportId);
        testReport.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Report")
    class CreateReportTests {

        @Test
        @DisplayName("Should create report with auto-generated code")
        void create_Success() {
            CreateReportRequest request = new CreateReportRequest(
                    "New Report", "Description", ReportType.FINANCIAL_SUMMARY,
                    null, OutputFormat.EXCEL, null, null, null, UUID.randomUUID());

            when(reportRepository.getNextCodeSequence()).thenReturn(1L);
            when(reportRepository.save(any(SavedReport.class))).thenAnswer(invocation -> {
                SavedReport r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            SavedReportResponse response = reportService.create(request);

            assertThat(response.code()).isEqualTo("RPT-00001");
            assertThat(response.name()).isEqualTo("New Report");
            assertThat(response.reportType()).isEqualTo(ReportType.FINANCIAL_SUMMARY);
            assertThat(response.outputFormat()).isEqualTo(OutputFormat.EXCEL);
            verify(auditService).logCreate(eq("SavedReport"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Execute Report")
    class ExecuteReportTests {

        @Test
        @DisplayName("Should execute report and create execution record")
        void execute_Success() {
            UUID executedById = UUID.randomUUID();
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
            when(executionRepository.save(any(ReportExecution.class))).thenAnswer(invocation -> {
                ReportExecution e = invocation.getArgument(0);
                if (e.getId() == null) {
                    e.setId(UUID.randomUUID());
                    e.setCreatedAt(Instant.now());
                }
                return e;
            });
            when(reportRepository.save(any(SavedReport.class))).thenReturn(testReport);

            ExecuteReportRequest request = new ExecuteReportRequest(executedById, "{}");
            ReportExecutionResponse response = reportService.executeReport(reportId, request);

            assertThat(response.reportId()).isEqualTo(reportId);
            assertThat(response.status()).isEqualTo(ExecutionStatus.COMPLETED);
            assertThat(response.outputUrl()).isNotNull();
            assertThat(testReport.getLastRunStatus()).isEqualTo(RunStatus.SUCCESS);
        }
    }

    @Nested
    @DisplayName("Schedule Report")
    class ScheduleReportTests {

        @Test
        @DisplayName("Should enable schedule with cron expression")
        void schedule_Success() {
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
            when(reportRepository.save(any(SavedReport.class))).thenAnswer(inv -> inv.getArgument(0));

            SavedReportResponse response = reportService.scheduleReport(
                    reportId, "0 0 8 * * MON", "[\"admin@company.ru\"]");

            assertThat(response.scheduleEnabled()).isTrue();
            assertThat(testReport.getScheduleCron()).isEqualTo("0 0 8 * * MON");
            assertThat(testReport.getScheduleRecipients()).isEqualTo("[\"admin@company.ru\"]");
        }
    }

    @Test
    @DisplayName("Should throw when report not found")
    void findById_NotFound() {
        UUID nonExistent = UUID.randomUUID();
        when(reportRepository.findById(nonExistent)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.findById(nonExistent))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("не найден");
    }

    @Test
    @DisplayName("Should soft delete report")
    void delete_Success() {
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(SavedReport.class))).thenReturn(testReport);

        reportService.delete(reportId);

        assertThat(testReport.isDeleted()).isTrue();
        verify(auditService).logDelete("SavedReport", reportId);
    }
}
