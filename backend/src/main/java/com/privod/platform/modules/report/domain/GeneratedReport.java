package com.privod.platform.modules.report.domain;

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

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "generated_reports", indexes = {
        @Index(name = "idx_gen_report_template", columnList = "template_id"),
        @Index(name = "idx_gen_report_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_gen_report_generated_by", columnList = "generated_by_id"),
        @Index(name = "idx_gen_report_generated_at", columnList = "generated_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedReport extends BaseEntity {

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parameters", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> parameters = Map.of();

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "file_size", nullable = false)
    @Builder.Default
    private long fileSize = 0;

    @Column(name = "generated_by_id", nullable = false)
    private UUID generatedById;

    @Column(name = "generated_at", nullable = false)
    @Builder.Default
    private Instant generatedAt = Instant.now();
}
