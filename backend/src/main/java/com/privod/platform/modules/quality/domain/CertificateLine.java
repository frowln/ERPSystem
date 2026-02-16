package com.privod.platform.modules.quality.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "certificate_lines", indexes = {
        @Index(name = "idx_cl_certificate", columnList = "certificate_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateLine extends BaseEntity {

    @Column(name = "certificate_id", nullable = false)
    private UUID certificateId;

    @Column(name = "parameter_name", nullable = false, length = 500)
    private String parameterName;

    @Column(name = "standard_value", length = 255)
    private String standardValue;

    @Column(name = "actual_value", length = 255)
    private String actualValue;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "is_compliant", nullable = false)
    @Builder.Default
    private boolean isCompliant = true;

    @Column(name = "test_method", length = 500)
    private String testMethod;
}
