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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "design_packages", indexes = {
        @Index(name = "idx_design_pkg_project", columnList = "project_id"),
        @Index(name = "idx_design_pkg_status", columnList = "status"),
        @Index(name = "idx_design_pkg_discipline", columnList = "discipline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignPackage extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", nullable = false, length = 30)
    private DesignDiscipline discipline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DesignPackageStatus status = DesignPackageStatus.DRAFT;

    @Column(name = "package_version")
    @Builder.Default
    private Integer packageVersion = 1;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;
}
