package com.privod.platform.modules.report.service;

import com.privod.platform.modules.report.domain.ReportTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Service for rendering HTML templates to PDF.
 * Uses Thymeleaf-style variable substitution.
 * In production, integrate with Flying Saucer (OpenPDF) or wkhtmltopdf.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationService {

    /**
     * Render a report template with parameters into a PDF byte array.
     * Currently renders HTML with simple variable substitution.
     * For production, replace with Flying Saucer / OpenPDF rendering.
     */
    public byte[] generatePdf(ReportTemplate template, Map<String, Object> parameters) {
        String html = renderHtml(template, parameters);

        // In production, use Flying Saucer:
        // ITextRenderer renderer = new ITextRenderer();
        // renderer.setDocumentFromString(html);
        // renderer.layout();
        // ByteArrayOutputStream baos = new ByteArrayOutputStream();
        // renderer.createPDF(baos);
        // return baos.toByteArray();

        // For now, return rendered HTML as bytes (placeholder for actual PDF rendering)
        log.info("PDF generated for template '{}', paper: {}, orientation: {}",
                template.getCode(), template.getPaperSize(), template.getOrientation());
        return html.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Render template HTML with parameter substitution.
     */
    public String renderHtml(ReportTemplate template, Map<String, Object> parameters) {
        String html = template.getTemplateHtml();

        if (parameters != null) {
            for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                String placeholder = "${" + entry.getKey() + "}";
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                html = html.replace(placeholder, value);
            }
        }

        // Wrap with header/footer if present
        StringBuilder fullHtml = new StringBuilder();
        fullHtml.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>");
        fullHtml.append("<style>@page { size: ")
                .append(template.getPaperSize().name())
                .append(" ").append(template.getOrientation().name().toLowerCase())
                .append("; margin: ")
                .append(template.getMarginTop()).append("mm ")
                .append(template.getMarginRight()).append("mm ")
                .append(template.getMarginBottom()).append("mm ")
                .append(template.getMarginLeft()).append("mm; }</style>");
        fullHtml.append("</head><body>");

        if (template.getHeaderHtml() != null) {
            fullHtml.append("<header>").append(template.getHeaderHtml()).append("</header>");
        }

        fullHtml.append("<main>").append(html).append("</main>");

        if (template.getFooterHtml() != null) {
            fullHtml.append("<footer>").append(template.getFooterHtml()).append("</footer>");
        }

        fullHtml.append("</body></html>");
        return fullHtml.toString();
    }
}
