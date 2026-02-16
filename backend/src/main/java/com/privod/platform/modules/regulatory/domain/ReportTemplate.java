package com.privod.platform.modules.regulatory.domain;

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

@Entity(name = "RegulatoryReportTemplate")
@Table(name = "report_templates", indexes = {
        @Index(name = "idx_report_template_type", columnList = "report_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTemplate extends BaseEntity {

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "required_fields", columnDefinition = "JSONB")
    private String requiredFields;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private ReportFrequency frequency;

    @Column(name = "template_file_url", length = 1000)
    private String templateFileUrl;

    @Column(name = "regulations", columnDefinition = "TEXT")
    private String regulations;
}
