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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "executive_schemes", indexes = {
        @Index(name = "idx_exec_scheme_project", columnList = "project_id"),
        @Index(name = "idx_exec_scheme_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveScheme extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 30)
    private WorkType workType;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "scale", length = 50)
    private String scale;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "geodata_json", columnDefinition = "jsonb")
    private Map<String, Object> geodataJson;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "verified_by_id")
    private UUID verifiedById;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExecutiveSchemeStatus status = ExecutiveSchemeStatus.DRAFT;

    public boolean canTransitionTo(ExecutiveSchemeStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
