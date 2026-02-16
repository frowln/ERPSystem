package com.privod.platform.modules.iot.domain;

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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "iot_dashboards", indexes = {
        @Index(name = "idx_iot_dashboard_project", columnList = "project_id"),
        @Index(name = "idx_iot_dashboard_creator", columnList = "created_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTDashboard extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "widgets", columnDefinition = "jsonb")
    private List<Map<String, Object>> widgets;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "created_by_id")
    private UUID createdById;
}
