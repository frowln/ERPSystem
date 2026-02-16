package com.privod.platform.modules.regulatory;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.RegulatoryReport;
import com.privod.platform.modules.regulatory.domain.ReportStatus;
import com.privod.platform.modules.regulatory.repository.RegulatoryReportRepository;
import com.privod.platform.modules.regulatory.service.RegulatoryReportService;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryReportRequest;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryReportResponse;
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
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegulatoryReportServiceTest {

    @Mock
    private RegulatoryReportRepository reportRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RegulatoryReportService reportService;

    private UUID reportId;
    private UUID projectId;
    private RegulatoryReport testReport;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testReport = RegulatoryReport.builder()
                .code("REG-00001")
                .projectId(projectId)
                .reportType("environmental")
                .title("Квартальный экологический отчёт")
                .period("Q1 2025")
                .dueDate(LocalDate.of(2025, 4, 15))
                .status(ReportStatus.DRAFT)
                .submittedToOrgan("Росприроднадзор")
                .preparedById(UUID.randomUUID())
                .build();
        testReport.setId(reportId);
        testReport.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Report")
    class CreateReportTests {

        @Test
        @DisplayName("Should create report with DRAFT status and generated code")
        void createReport_SetsDefaultDraftStatus() {
            CreateRegulatoryReportRequest request = new CreateRegulatoryReportRequest(
                    projectId, "environmental", "Экологический отчёт",
                    "Q1 2025", LocalDate.of(2025, 4, 15),
                    "Росприроднадзор", null, UUID.randomUUID());

            when(reportRepository.getNextNumberSequence()).thenReturn(1L);
            when(reportRepository.save(any(RegulatoryReport.class))).thenAnswer(invocation -> {
                RegulatoryReport r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            RegulatoryReportResponse response = reportService.createReport(request);

            assertThat(response.status()).isEqualTo(ReportStatus.DRAFT);
            assertThat(response.code()).isEqualTo("REG-00001");
            assertThat(response.reportType()).isEqualTo("environmental");
            verify(auditService).logCreate(eq("RegulatoryReport"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Submit Report")
    class SubmitReportTests {

        @Test
        @DisplayName("Should submit DRAFT report and set submittedAt")
        void submitReport_ValidTransition() {
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
            when(reportRepository.save(any(RegulatoryReport.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID submitterId = UUID.randomUUID();
            RegulatoryReportResponse response = reportService.submitReport(reportId, submitterId);

            assertThat(response.status()).isEqualTo(ReportStatus.SUBMITTED);
            assertThat(response.submittedById()).isEqualTo(submitterId);
            verify(auditService).logStatusChange("RegulatoryReport", reportId,
                    "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should reject submit from ACCEPTED status")
        void submitReport_InvalidFromAccepted() {
            testReport.setStatus(ReportStatus.ACCEPTED);
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));

            assertThatThrownBy(() -> reportService.submitReport(reportId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить отчёт");
        }
    }

    @Nested
    @DisplayName("Accept/Reject Report")
    class AcceptRejectTests {

        @Test
        @DisplayName("Should accept submitted report")
        void acceptReport_ValidTransition() {
            testReport.setStatus(ReportStatus.SUBMITTED);
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
            when(reportRepository.save(any(RegulatoryReport.class))).thenAnswer(inv -> inv.getArgument(0));

            RegulatoryReportResponse response = reportService.acceptReport(reportId);

            assertThat(response.status()).isEqualTo(ReportStatus.ACCEPTED);
            verify(auditService).logStatusChange("RegulatoryReport", reportId,
                    "SUBMITTED", "ACCEPTED");
        }

        @Test
        @DisplayName("Should reject submitted report with reason")
        void rejectReport_ValidTransition() {
            testReport.setStatus(ReportStatus.SUBMITTED);
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
            when(reportRepository.save(any(RegulatoryReport.class))).thenAnswer(inv -> inv.getArgument(0));

            RegulatoryReportResponse response = reportService.rejectReport(reportId, "Неполные данные");

            assertThat(response.status()).isEqualTo(ReportStatus.REJECTED);
            assertThat(response.organResponse()).isEqualTo("Неполные данные");
        }
    }

    @Nested
    @DisplayName("Get Report")
    class GetReportTests {

        @Test
        @DisplayName("Should find report by ID")
        void getReport_Success() {
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));

            RegulatoryReportResponse response = reportService.getReport(reportId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("REG-00001");
            assertThat(response.title()).isEqualTo("Квартальный экологический отчёт");
        }

        @Test
        @DisplayName("Should throw when report not found")
        void getReport_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(reportRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportService.getReport(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Регуляторный отчёт не найден");
        }
    }
}
