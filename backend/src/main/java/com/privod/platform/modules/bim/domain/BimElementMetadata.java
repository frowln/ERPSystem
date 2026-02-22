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

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bim_element_metadata", indexes = {
        @Index(name = "idx_bim_element_meta_org", columnList = "organization_id"),
        @Index(name = "idx_bim_element_meta_model", columnList = "model_id"),
        @Index(name = "idx_bim_element_meta_ifc_type", columnList = "ifc_type"),
        @Index(name = "idx_bim_element_meta_floor", columnList = "floor_name")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimElementMetadata extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "element_guid", nullable = false, length = 255)
    private String elementGuid;

    @Column(name = "element_name", length = 500)
    private String elementName;

    @Column(name = "ifc_type", length = 255)
    private String ifcType;

    @Column(name = "floor_name", length = 255)
    private String floorName;

    @Column(name = "system_name", length = 255)
    private String systemName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "properties_json", columnDefinition = "jsonb")
    private Map<String, Object> propertiesJson;
}
