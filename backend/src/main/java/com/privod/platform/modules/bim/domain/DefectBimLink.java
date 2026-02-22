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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "defect_bim_links", indexes = {
        @Index(name = "idx_defect_bim_link_org", columnList = "organization_id"),
        @Index(name = "idx_defect_bim_link_defect", columnList = "defect_id"),
        @Index(name = "idx_defect_bim_link_model", columnList = "model_id"),
        @Index(name = "idx_defect_bim_link_element", columnList = "element_guid"),
        @Index(name = "idx_defect_bim_link_floor", columnList = "floor_name"),
        @Index(name = "idx_defect_bim_link_system", columnList = "system_name")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DefectBimLink extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "defect_id", nullable = false)
    private UUID defectId;

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "element_guid", nullable = false, length = 255)
    private String elementGuid;

    @Column(name = "element_name", length = 500)
    private String elementName;

    @Column(name = "element_type", length = 200)
    private String elementType;

    @Column(name = "floor_name", length = 200)
    private String floorName;

    @Column(name = "system_name", length = 200)
    private String systemName;

    @Column(name = "pin_x")
    private Double pinX;

    @Column(name = "pin_y")
    private Double pinY;

    @Column(name = "pin_z")
    private Double pinZ;

    @Column(name = "camera_position_json", columnDefinition = "JSONB")
    private String cameraPositionJson;

    @Column(name = "screenshot_url", length = 1000)
    private String screenshotUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "linked_by_user_id")
    private UUID linkedByUserId;

    @Column(name = "linked_at", nullable = false)
    @Builder.Default
    private Instant linkedAt = Instant.now();
}
