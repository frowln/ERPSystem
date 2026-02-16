package com.privod.platform.modules.hrRussian.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "certificate_types", indexes = {
        @Index(name = "idx_cert_type_code", columnList = "code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrCertificateType extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_for_positions", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String requiredForPositions = "[]";

    @Column(name = "validity_months", nullable = false)
    @Builder.Default
    private int validityMonths = 12;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean required = false;
}
