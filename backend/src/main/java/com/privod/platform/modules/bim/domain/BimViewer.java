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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bim_viewers", indexes = {
        @Index(name = "idx_bim_viewer_model", columnList = "model_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimViewer extends BaseEntity {

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "view_name", nullable = false, length = 255)
    private String viewName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "camera_position", columnDefinition = "jsonb")
    private Map<String, Object> cameraPosition;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;
}
