package com.privod.platform.modules.design.domain;

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
@Table(name = "design_sections", indexes = {
        @Index(name = "idx_ds_project", columnList = "project_id"),
        @Index(name = "idx_ds_code", columnList = "code"),
        @Index(name = "idx_ds_parent", columnList = "parent_id"),
        @Index(name = "idx_ds_discipline", columnList = "discipline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignSection extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "discipline", length = 100)
    private String discipline;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private int sequence = 0;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
