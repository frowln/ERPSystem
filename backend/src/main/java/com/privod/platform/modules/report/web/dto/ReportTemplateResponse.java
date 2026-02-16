package com.privod.platform.modules.report.web.dto;

import com.privod.platform.modules.report.domain.Orientation;
import com.privod.platform.modules.report.domain.PaperSize;
import com.privod.platform.modules.report.domain.ReportTemplate;

import java.time.Instant;
import java.util.UUID;

public record ReportTemplateResponse(
        UUID id,
        String code,
        String name,
        String reportType,
        String templateHtml,
        String headerHtml,
        String footerHtml,
        PaperSize paperSize,
        String paperSizeDisplayName,
        Orientation orientation,
        String orientationDisplayName,
        int marginTop,
        int marginBottom,
        int marginLeft,
        int marginRight,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static ReportTemplateResponse fromEntity(ReportTemplate entity) {
        return new ReportTemplateResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getReportType(),
                entity.getTemplateHtml(),
                entity.getHeaderHtml(),
                entity.getFooterHtml(),
                entity.getPaperSize(),
                entity.getPaperSize().getDisplayName(),
                entity.getOrientation(),
                entity.getOrientation().getDisplayName(),
                entity.getMarginTop(),
                entity.getMarginBottom(),
                entity.getMarginLeft(),
                entity.getMarginRight(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
