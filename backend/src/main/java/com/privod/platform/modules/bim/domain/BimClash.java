package com.privod.platform.modules.bim.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bim_clashes", indexes = {
        @Index(name = "idx_bim_clash_model_a", columnList = "model_a_id"),
        @Index(name = "idx_bim_clash_model_b", columnList = "model_b_id"),
        @Index(name = "idx_bim_clash_status", columnList = "status"),
        @Index(name = "idx_bim_clash_severity", columnList = "severity")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimClash extends BaseEntity {

    @Column(name = "model_a_id", nullable = false)
    private UUID modelAId;

    @Column(name = "model_b_id")
    private UUID modelBId;

    @Column(name = "element_a_id", length = 255)
    private String elementAId;

    @Column(name = "element_b_id", length = 255)
    private String elementBId;

    @Enumerated(EnumType.STRING)
    @Column(name = "clash_type", nullable = false, length = 30)
    @Builder.Default
    private ClashType clashType = ClashType.HARD;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    @Builder.Default
    private ClashSeverity severity = ClashSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClashStatus status = ClashStatus.NEW;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "coordinates", columnDefinition = "jsonb")
    private Map<String, Object> coordinates;

    @Column(name = "resolved_by_id")
    private UUID resolvedById;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
