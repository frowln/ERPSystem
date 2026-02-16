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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "regulatory_inspections", indexes = {
        @Index(name = "idx_reg_inspection_project", columnList = "project_id"),
        @Index(name = "idx_reg_inspection_date", columnList = "inspection_date"),
        @Index(name = "idx_reg_inspection_type", columnList = "inspection_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegulatoryInspection extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "inspector_organ", length = 500)
    private String inspectorOrgan;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 20)
    private RegulatoryInspectionType inspectionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private InspectionResult result;

    @Column(name = "violations", columnDefinition = "JSONB")
    private String violations;

    @Column(name = "prescriptions", columnDefinition = "JSONB")
    private String prescriptionsJson;

    @Column(name = "deadline_to_fix")
    private LocalDate deadlineToFix;

    @Column(name = "act_number", length = 100)
    private String actNumber;

    @Column(name = "act_url", length = 1000)
    private String actUrl;
}
