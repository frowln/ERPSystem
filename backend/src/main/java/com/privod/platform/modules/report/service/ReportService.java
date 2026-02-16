package com.privod.platform.modules.report.service;

import com.privod.platform.modules.report.domain.GeneratedReport;
import com.privod.platform.modules.report.domain.Orientation;
import com.privod.platform.modules.report.domain.PaperSize;
import com.privod.platform.modules.report.domain.PrintForm;
import com.privod.platform.modules.report.domain.ReportTemplate;
import com.privod.platform.modules.report.repository.GeneratedReportRepository;
import com.privod.platform.modules.report.repository.PrintFormRepository;
import com.privod.platform.modules.report.repository.ReportTemplateRepository;
import com.privod.platform.modules.report.web.dto.CreateReportTemplateRequest;
import com.privod.platform.modules.report.web.dto.GenerateReportRequest;
import com.privod.platform.modules.report.web.dto.GeneratedReportResponse;
import com.privod.platform.modules.report.web.dto.PrintFormResponse;
import com.privod.platform.modules.report.web.dto.ReportTemplateResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportTemplateRepository templateRepository;
    private final GeneratedReportRepository generatedReportRepository;
    private final PrintFormRepository printFormRepository;
    private final PdfGenerationService pdfGenerationService;

    @Transactional
    public ReportTemplateResponse createTemplate(CreateReportTemplateRequest request) {
        if (templateRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Шаблон с кодом уже существует: " + request.code());
        }

        ReportTemplate template = ReportTemplate.builder()
                .code(request.code())
                .name(request.name())
                .reportType(request.reportType())
                .templateHtml(request.templateHtml())
                .headerHtml(request.headerHtml())
                .footerHtml(request.footerHtml())
                .paperSize(request.paperSize() != null ? request.paperSize() : PaperSize.A4)
                .orientation(request.orientation() != null ? request.orientation() : Orientation.PORTRAIT)
                .marginTop(request.marginTop() != null ? request.marginTop() : 20)
                .marginBottom(request.marginBottom() != null ? request.marginBottom() : 20)
                .marginLeft(request.marginLeft() != null ? request.marginLeft() : 15)
                .marginRight(request.marginRight() != null ? request.marginRight() : 15)
                .isActive(true)
                .build();

        template = templateRepository.save(template);
        log.info("Report template created: {} ({})", template.getCode(), template.getId());
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public Page<ReportTemplateResponse> getTemplates(String reportType, Pageable pageable) {
        if (reportType != null && !reportType.isBlank()) {
            return templateRepository.findByReportTypeAndDeletedFalse(reportType, pageable)
                    .map(ReportTemplateResponse::fromEntity);
        }
        return templateRepository.findByDeletedFalse(pageable)
                .map(ReportTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ReportTemplateResponse getTemplate(String code) {
        ReportTemplate template = getTemplateOrThrow(code);
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional
    public ReportTemplateResponse updateTemplate(String code, CreateReportTemplateRequest request) {
        ReportTemplate template = getTemplateOrThrow(code);

        if (request.name() != null) template.setName(request.name());
        if (request.reportType() != null) template.setReportType(request.reportType());
        if (request.templateHtml() != null) template.setTemplateHtml(request.templateHtml());
        if (request.headerHtml() != null) template.setHeaderHtml(request.headerHtml());
        if (request.footerHtml() != null) template.setFooterHtml(request.footerHtml());
        if (request.paperSize() != null) template.setPaperSize(request.paperSize());
        if (request.orientation() != null) template.setOrientation(request.orientation());
        if (request.marginTop() != null) template.setMarginTop(request.marginTop());
        if (request.marginBottom() != null) template.setMarginBottom(request.marginBottom());
        if (request.marginLeft() != null) template.setMarginLeft(request.marginLeft());
        if (request.marginRight() != null) template.setMarginRight(request.marginRight());

        template = templateRepository.save(template);
        log.info("Report template updated: {} ({})", template.getCode(), template.getId());
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(String code) {
        ReportTemplate template = getTemplateOrThrow(code);
        template.softDelete();
        templateRepository.save(template);
        log.info("Report template deleted: {}", code);
    }

    @Transactional
    public GeneratedReportResponse generateReport(GenerateReportRequest request) {
        ReportTemplate template = getTemplateOrThrow(request.templateCode());

        Map<String, Object> params = request.parameters() != null ? request.parameters() : Map.of();
        byte[] pdfBytes = pdfGenerationService.generatePdf(template, params);

        // In production, upload to S3/MinIO and get URL
        String fileUrl = "/reports/generated/" + UUID.randomUUID() + ".pdf";

        GeneratedReport report = GeneratedReport.builder()
                .templateId(template.getId())
                .entityType(request.entityType())
                .entityId(request.entityId())
                .parameters(params)
                .fileUrl(fileUrl)
                .fileSize(pdfBytes.length)
                .generatedById(request.generatedById())
                .generatedAt(Instant.now())
                .build();

        report = generatedReportRepository.save(report);
        log.info("Report generated: template={}, entity={}/{}, user={}",
                request.templateCode(), request.entityType(), request.entityId(),
                request.generatedById());
        return GeneratedReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<GeneratedReportResponse> getGeneratedReports(String entityType, UUID entityId,
                                                               Pageable pageable) {
        return generatedReportRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId, pageable)
                .map(GeneratedReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<PrintFormResponse> getPrintForms(String entityType) {
        return printFormRepository
                .findByEntityTypeAndIsActiveTrueAndDeletedFalseOrderBySortOrder(entityType)
                .stream()
                .map(PrintFormResponse::fromEntity)
                .toList();
    }

    private ReportTemplate getTemplateOrThrow(String code) {
        return templateRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон отчета не найден: " + code));
    }
}
