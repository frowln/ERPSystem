package com.privod.platform.modules.pto.domain;

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
@Table(name = "lab_tests", indexes = {
        @Index(name = "idx_lab_test_project", columnList = "project_id"),
        @Index(name = "idx_lab_test_conclusion", columnList = "conclusion")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTest extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "material_name", nullable = false, length = 500)
    private String materialName;

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false, length = 30)
    private LabTestType testType;

    @Column(name = "sample_number", length = 100)
    private String sampleNumber;

    @Column(name = "test_date", nullable = false)
    private LocalDate testDate;

    @Column(name = "result", length = 500)
    private String result;

    @Enumerated(EnumType.STRING)
    @Column(name = "conclusion", nullable = false, length = 20)
    private LabTestConclusion conclusion;

    @Column(name = "protocol_url", length = 1000)
    private String protocolUrl;

    @Column(name = "lab_name", length = 500)
    private String labName;

    @Column(name = "performed_by_id")
    private UUID performedById;
}
