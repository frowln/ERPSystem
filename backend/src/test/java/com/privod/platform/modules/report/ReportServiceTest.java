package com.privod.platform.modules.report;

import com.privod.platform.modules.report.domain.GeneratedReport;
import com.privod.platform.modules.report.domain.Orientation;
import com.privod.platform.modules.report.domain.PaperSize;
import com.privod.platform.modules.report.domain.ReportTemplate;
import com.privod.platform.modules.report.repository.GeneratedReportRepository;
import com.privod.platform.modules.report.repository.PrintFormRepository;
import com.privod.platform.modules.report.repository.ReportTemplateRepository;
import com.privod.platform.modules.report.service.PdfGenerationService;
import com.privod.platform.modules.report.service.ReportService;
import com.privod.platform.modules.report.web.dto.CreateReportTemplateRequest;
import com.privod.platform.modules.report.web.dto.GenerateReportRequest;
import com.privod.platform.modules.report.web.dto.GeneratedReportResponse;
import com.privod.platform.modules.report.web.dto.ReportTemplateResponse;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportTemplateRepository templateRepository;

    @Mock
    private GeneratedReportRepository generatedReportRepository;

    @Mock
    private PrintFormRepository printFormRepository;

    @Mock
    private PdfGenerationService pdfGenerationService;

    @InjectMocks
    private ReportService reportService;

    private ReportTemplate testTemplate;

    @BeforeEach
    void setUp() {
        testTemplate = ReportTemplate.builder()
                .code("ACT_KS2")
                .name("Акт КС-2")
                .reportType("closing_document")
                .templateHtml("<h1>Акт о приемке выполненных работ</h1><p>${projectName}</p>")
                .paperSize(PaperSize.A4)
                .orientation(Orientation.PORTRAIT)
                .marginTop(20)
                .marginBottom(20)
                .marginLeft(15)
                .marginRight(15)
                .isActive(true)
                .build();
        testTemplate.setId(UUID.randomUUID());
        testTemplate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Template")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should create a report template")
        void createTemplate_Success() {
            CreateReportTemplateRequest request = new CreateReportTemplateRequest(
                    "ACT_KS2", "Акт КС-2", "closing_document",
                    "<h1>Акт</h1>", null, null,
                    PaperSize.A4, Orientation.PORTRAIT,
                    20, 20, 15, 15
            );

            when(templateRepository.existsByCodeAndDeletedFalse("ACT_KS2")).thenReturn(false);
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> {
                ReportTemplate t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            ReportTemplateResponse response = reportService.createTemplate(request);

            assertThat(response.code()).isEqualTo("ACT_KS2");
            assertThat(response.name()).isEqualTo("Акт КС-2");
            assertThat(response.paperSize()).isEqualTo(PaperSize.A4);
            assertThat(response.paperSizeDisplayName()).isEqualTo("А4");
            assertThat(response.orientationDisplayName()).isEqualTo("Книжная");
        }

        @Test
        @DisplayName("Should throw when template code already exists")
        void createTemplate_DuplicateCode() {
            CreateReportTemplateRequest request = new CreateReportTemplateRequest(
                    "ACT_KS2", "Акт КС-2", "closing_document",
                    "<h1>Акт</h1>", null, null,
                    null, null, null, null, null, null
            );

            when(templateRepository.existsByCodeAndDeletedFalse("ACT_KS2")).thenReturn(true);

            assertThatThrownBy(() -> reportService.createTemplate(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Generate Report")
    class GenerateTests {

        @Test
        @DisplayName("Should generate a PDF report")
        void generateReport_Success() {
            UUID userId = UUID.randomUUID();
            UUID entityId = UUID.randomUUID();
            GenerateReportRequest request = new GenerateReportRequest(
                    "ACT_KS2", "project", entityId,
                    Map.of("projectName", "ЖК Солнечный"),
                    userId
            );

            when(templateRepository.findByCodeAndDeletedFalse("ACT_KS2"))
                    .thenReturn(Optional.of(testTemplate));
            when(pdfGenerationService.generatePdf(any(ReportTemplate.class), anyMap()))
                    .thenReturn("PDF_CONTENT".getBytes());
            when(generatedReportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> {
                GeneratedReport r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            GeneratedReportResponse response = reportService.generateReport(request);

            assertThat(response.templateId()).isEqualTo(testTemplate.getId());
            assertThat(response.entityType()).isEqualTo("project");
            assertThat(response.fileUrl()).startsWith("/reports/generated/");
            assertThat(response.fileSize()).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should throw when template not found")
        void generateReport_TemplateNotFound() {
            GenerateReportRequest request = new GenerateReportRequest(
                    "NONEXISTENT", "project", UUID.randomUUID(),
                    Map.of(), UUID.randomUUID()
            );

            when(templateRepository.findByCodeAndDeletedFalse("NONEXISTENT"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportService.generateReport(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон отчета не найден");
        }
    }
}
