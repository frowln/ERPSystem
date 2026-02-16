package com.privod.platform.modules.report.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity(name = "PdfReportTemplate")
@Table(name = "pdf_report_templates", indexes = {
        @Index(name = "idx_report_template_code", columnList = "code", unique = true),
        @Index(name = "idx_rpt_report_template_type", columnList = "report_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTemplate extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(name = "template_html", columnDefinition = "TEXT", nullable = false)
    private String templateHtml;

    @Column(name = "header_html", columnDefinition = "TEXT")
    private String headerHtml;

    @Column(name = "footer_html", columnDefinition = "TEXT")
    private String footerHtml;

    @Enumerated(EnumType.STRING)
    @Column(name = "paper_size", nullable = false, length = 20)
    @Builder.Default
    private PaperSize paperSize = PaperSize.A4;

    @Enumerated(EnumType.STRING)
    @Column(name = "orientation", nullable = false, length = 20)
    @Builder.Default
    private Orientation orientation = Orientation.PORTRAIT;

    @Column(name = "margin_top", nullable = false)
    @Builder.Default
    private int marginTop = 20;

    @Column(name = "margin_bottom", nullable = false)
    @Builder.Default
    private int marginBottom = 20;

    @Column(name = "margin_left", nullable = false)
    @Builder.Default
    private int marginLeft = 15;

    @Column(name = "margin_right", nullable = false)
    @Builder.Default
    private int marginRight = 15;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
