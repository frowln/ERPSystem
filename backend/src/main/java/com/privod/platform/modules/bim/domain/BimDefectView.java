package com.privod.platform.modules.bim.domain;

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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "bim_defect_views", indexes = {
        @Index(name = "idx_bim_defect_view_org", columnList = "organization_id"),
        @Index(name = "idx_bim_defect_view_project", columnList = "project_id"),
        @Index(name = "idx_bim_defect_view_model", columnList = "model_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimDefectView extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "model_id")
    private UUID modelId;

    @Column(name = "filter_floor", length = 200)
    private String filterFloor;

    @Column(name = "filter_system", length = 200)
    private String filterSystem;

    @Column(name = "filter_defect_status", length = 30)
    private String filterDefectStatus;

    @Column(name = "camera_preset_json", columnDefinition = "JSONB")
    private String cameraPresetJson;

    @Column(name = "element_guids_json", columnDefinition = "JSONB")
    private String elementGuidsJson;

    @Column(name = "is_shared", nullable = false)
    @Builder.Default
    private Boolean isShared = false;
}
