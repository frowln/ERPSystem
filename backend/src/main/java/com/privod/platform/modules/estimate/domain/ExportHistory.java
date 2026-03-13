package com.privod.platform.modules.estimate.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "estimate_export_history")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportHistory extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "estimate_id", nullable = false)
    private UUID estimateId;

    @Column(name = "estimate_name", length = 500)
    private String estimateName;

    @Column(name = "export_date", nullable = false)
    @Builder.Default
    private Instant exportDate = Instant.now();

    @Column(name = "format", nullable = false, length = 50)
    private String format;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "success";
}
