package com.privod.platform.infrastructure.report;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Service for rendering Thymeleaf HTML templates into PDF byte arrays
 * using Flying Saucer (xhtmlrenderer) with OpenPDF.
 * <p>
 * Templates reside under {@code classpath:/templates/reports/} and are resolved
 * by Thymeleaf's default Spring template resolver.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfReportService {

    private final TemplateEngine templateEngine;

    /**
     * Render a named Thymeleaf template with arbitrary data into a PDF byte array.
     *
     * @param templateName template path relative to {@code templates/}, e.g. "reports/ks2-report"
     * @param data         model attributes injected into the template
     * @return PDF content as a byte array
     */
    public byte[] generateReport(String templateName, Map<String, Object> data) {
        log.info("Generating PDF report from template '{}'", templateName);

        Context context = new Context(new Locale("ru", "RU"));
        context.setVariables(data);

        String html = templateEngine.process(templateName, context);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(baos);
            renderer.finishPDF();

            byte[] pdf = baos.toByteArray();
            log.info("PDF generated successfully: template='{}', size={} bytes", templateName, pdf.length);
            return pdf;
        } catch (Exception e) {
            log.error("Failed to generate PDF from template '{}': {}", templateName, e.getMessage(), e);
            throw new PdfGenerationException("Failed to generate PDF report", e);
        }
    }

    /**
     * Generate a KS-2 (Act of Completed Works) PDF.
     */
    public byte[] generateKs2Report(UUID ks2Id) {
        log.info("Generating KS-2 report for id={}", ks2Id);
        return generateReport("reports/ks2-report", Map.of(
                "ks2Id", ks2Id.toString(),
                "reportTitle", "Акт о приемке выполненных работ (КС-2)"
        ));
    }

    /**
     * Generate a KS-3 (Cost Certificate) PDF.
     */
    public byte[] generateKs3Report(UUID ks3Id) {
        log.info("Generating KS-3 report for id={}", ks3Id);
        return generateReport("reports/ks3-report", Map.of(
                "ks3Id", ks3Id.toString(),
                "reportTitle", "Справка о стоимости выполненных работ и затрат (КС-3)"
        ));
    }

    /**
     * Generate a project summary PDF.
     */
    public byte[] generateProjectSummary(UUID projectId) {
        log.info("Generating project summary for id={}", projectId);
        return generateReport("reports/project-summary", Map.of(
                "projectId", projectId.toString(),
                "reportTitle", "Project Summary Report"
        ));
    }

    /**
     * Generate a safety inspection PDF.
     */
    public byte[] generateSafetyReport(UUID inspectionId) {
        log.info("Generating safety report for inspectionId={}", inspectionId);
        return generateReport("reports/safety-inspection", Map.of(
                "inspectionId", inspectionId.toString(),
                "reportTitle", "Safety Inspection Report"
        ));
    }

    /**
     * Generate a daily log PDF.
     */
    public byte[] generateDailyLogReport(UUID dailyLogId) {
        log.info("Generating daily log report for dailyLogId={}", dailyLogId);
        return generateReport("reports/daily-log", Map.of(
                "dailyLogId", dailyLogId.toString(),
                "reportTitle", "Daily Construction Log"
        ));
    }

    /**
     * Runtime exception for PDF generation failures.
     */
    public static class PdfGenerationException extends RuntimeException {
        public PdfGenerationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
