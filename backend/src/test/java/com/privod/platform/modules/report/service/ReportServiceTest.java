package com.privod.platform.modules.report.service;

import com.privod.platform.modules.report.domain.GeneratedReport;
import com.privod.platform.modules.report.domain.Orientation;
import com.privod.platform.modules.report.domain.PaperSize;
import com.privod.platform.modules.report.domain.ReportTemplate;
import com.privod.platform.modules.report.repository.GeneratedReportRepository;
import com.privod.platform.modules.report.repository.PrintFormRepository;
import com.privod.platform.modules.report.repository.ReportTemplateRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
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
    private ReportTemplateRepository templateRepository;

    @Mock
    private GeneratedReportRepository generatedReportRepository;

    @Mock
    private PrintFormRepository printFormRepository;

    @Mock
    private PdfGenerationService pdfGenerationService;

    @InjectMocks
    private ReportService reportService;

    private UUID templateId;
    private ReportTemplate testTemplate;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();

        testTemplate = ReportTemplate.builder()
                .code("KS2_REPORT")
                .name("Отчёт КС-2")
                .reportType("closing")
                .templateHtml("<html>template</html>")
                .paperSize(PaperSize.A4)
                .orientation(Orientation.PORTRAIT)
                .marginTop(20)
                .marginBottom(20)
                .marginLeft(15)
                .marginRight(15)
                .isActive(true)
                .build();
        testTemplate.setId(templateId);
        testTemplate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Report Template")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should create report template with defaults")
        void shouldCreateTemplate_whenValidInput() {
            CreateReportTemplateRequest request = new CreateReportTemplateRequest(
                    "NEW_REPORT", "Новый отчёт", "general",
                    "<html>body</html>", null, null,
                    null, null, null, null, null, null);

            when(templateRepository.existsByCodeAndDeletedFalse("NEW_REPORT")).thenReturn(false);
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> {
                ReportTemplate t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            ReportTemplateResponse response = reportService.createTemplate(request);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("NEW_REPORT");
            assertThat(response.paperSize()).isEqualTo(PaperSize.A4);
            assertThat(response.orientation()).isEqualTo(Orientation.PORTRAIT);
        }

        @Test
        @DisplayName("Should throw when template code already exists")
        void shouldThrowException_whenDuplicateCode() {
            CreateReportTemplateRequest request = new CreateReportTemplateRequest(
                    "KS2_REPORT", "Дубликат", "closing",
                    "<html></html>", null, null,
                    null, null, null, null, null, null);

            when(templateRepository.existsByCodeAndDeletedFalse("KS2_REPORT")).thenReturn(true);

            assertThatThrownBy(() -> reportService.createTemplate(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Шаблон с кодом уже существует");
        }

        @Test
        @DisplayName("Should apply default margins when not specified")
        void shouldApplyDefaultMargins_whenNotSpecified() {
            CreateReportTemplateRequest request = new CreateReportTemplateRequest(
                    "MARGIN_TEST", "Тест", "test",
                    "<html></html>", null, null,
                    null, null, null, null, null, null);

            when(templateRepository.existsByCodeAndDeletedFalse("MARGIN_TEST")).thenReturn(false);
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> {
                ReportTemplate t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            ReportTemplateResponse response = reportService.createTemplate(request);

            assertThat(response.marginTop()).isEqualTo(20);
            assertThat(response.marginBottom()).isEqualTo(20);
            assertThat(response.marginLeft()).isEqualTo(15);
            assertThat(response.marginRight()).isEqualTo(15);
        }
    }

    @Nested
    @DisplayName("Get Templates")
    class GetTemplateTests {

        @Test
        @DisplayName("Should get template by code")
        void shouldReturnTemplate_whenCodeExists() {
            when(templateRepository.findByCodeAndDeletedFalse("KS2_REPORT"))
                    .thenReturn(Optional.of(testTemplate));

            ReportTemplateResponse response = reportService.getTemplate("KS2_REPORT");

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("KS2_REPORT");
            assertThat(response.name()).isEqualTo("Отчёт КС-2");
        }

        @Test
        @DisplayName("Should throw when template code not found")
        void shouldThrowException_whenTemplateNotFound() {
            when(templateRepository.findByCodeAndDeletedFalse("NONEXISTENT"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportService.getTemplate("NONEXISTENT"))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон отчета не найден");
        }

        @Test
        @DisplayName("Should list templates by report type")
        void shouldListTemplates_filteredByType() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ReportTemplate> page = new PageImpl<>(List.of(testTemplate));
            when(templateRepository.findByReportTypeAndDeletedFalse("closing", pageable))
                    .thenReturn(page);

            Page<ReportTemplateResponse> result = reportService.getTemplates("closing", pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Generate Report")
    class GenerateReportTests {

        @Test
        @DisplayName("Should generate report from template")
        void shouldGenerateReport_whenValidRequest() {
            UUID entityId = UUID.randomUUID();
            UUID generatedById = UUID.randomUUID();

            GenerateReportRequest request = new GenerateReportRequest(
                    "KS2_REPORT", "Ks2Document", entityId,
                    Map.of("key", "value"), generatedById);

            when(templateRepository.findByCodeAndDeletedFalse("KS2_REPORT"))
                    .thenReturn(Optional.of(testTemplate));
            when(pdfGenerationService.generatePdf(any(ReportTemplate.class), any()))
                    .thenReturn(new byte[]{1, 2, 3});
            when(generatedReportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> {
                GeneratedReport r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            GeneratedReportResponse response = reportService.generateReport(request);

            assertThat(response).isNotNull();
            assertThat(response.fileUrl()).contains("/reports/generated/");
            assertThat(response.fileSize()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should use empty map when parameters are null")
        void shouldUseEmptyParams_whenParametersAreNull() {
            GenerateReportRequest request = new GenerateReportRequest(
                    "KS2_REPORT", "Ks2Document", UUID.randomUUID(), null, UUID.randomUUID());

            when(templateRepository.findByCodeAndDeletedFalse("KS2_REPORT"))
                    .thenReturn(Optional.of(testTemplate));
            when(pdfGenerationService.generatePdf(eq(testTemplate), eq(Map.of())))
                    .thenReturn(new byte[]{1});
            when(generatedReportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> {
                GeneratedReport r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            GeneratedReportResponse response = reportService.generateReport(request);

            assertThat(response).isNotNull();
            verify(pdfGenerationService).generatePdf(testTemplate, Map.of());
        }
    }
}
