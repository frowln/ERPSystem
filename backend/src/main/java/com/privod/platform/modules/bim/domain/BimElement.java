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
@Table(name = "bim_elements", indexes = {
        @Index(name = "idx_bim_element_model", columnList = "model_id"),
        @Index(name = "idx_bim_element_eid", columnList = "element_id"),
        @Index(name = "idx_bim_element_ifc_type", columnList = "ifc_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimElement extends BaseEntity {

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "element_id", nullable = false, length = 255)
    private String elementId;

    @Column(name = "ifc_type", nullable = false, length = 255)
    private String ifcType;

    @Column(name = "name", length = 500)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "properties", columnDefinition = "jsonb")
    private Map<String, Object> properties;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "geometry", columnDefinition = "jsonb")
    private Map<String, Object> geometry;

    @Column(name = "floor", length = 100)
    private String floor;

    @Column(name = "zone", length = 100)
    private String zone;
}
