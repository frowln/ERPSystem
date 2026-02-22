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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bim_viewer_sessions", indexes = {
        @Index(name = "idx_bim_viewer_session_org", columnList = "organization_id"),
        @Index(name = "idx_bim_viewer_session_user", columnList = "user_id"),
        @Index(name = "idx_bim_viewer_session_model", columnList = "model_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimViewerSession extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "camera_position_json", columnDefinition = "jsonb")
    private Map<String, Object> cameraPositionJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "selected_elements_json", columnDefinition = "jsonb")
    private List<String> selectedElementsJson;
}
