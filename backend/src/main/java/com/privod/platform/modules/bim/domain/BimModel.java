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

import java.util.UUID;

@Entity
@Table(name = "bim_models", indexes = {
        @Index(name = "idx_bim_model_project", columnList = "project_id"),
        @Index(name = "idx_bim_model_status", columnList = "status"),
        @Index(name = "idx_bim_model_type", columnList = "model_type"),
        @Index(name = "idx_bim_model_format", columnList = "format")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimModel extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "model_type", nullable = false, length = 30)
    @Builder.Default
    private BimModelType modelType = BimModelType.ARCHITECTURAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false, length = 30)
    @Builder.Default
    private BimModelFormat format = BimModelFormat.IFC;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BimModelStatus status = BimModelStatus.DRAFT;

    @Column(name = "uploaded_by_id")
    private UUID uploadedById;

    @Column(name = "element_count")
    @Builder.Default
    private Integer elementCount = 0;

    @Column(name = "model_version")
    @Builder.Default
    private Integer modelVersion = 1;
}
