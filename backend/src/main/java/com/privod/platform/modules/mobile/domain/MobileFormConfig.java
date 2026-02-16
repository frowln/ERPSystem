package com.privod.platform.modules.mobile.domain;

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

@Entity
@Table(name = "mobile_form_configs", indexes = {
        @Index(name = "idx_mobile_form_entity", columnList = "entity_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobileFormConfig extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_layout", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> formLayout;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_fields", columnDefinition = "jsonb")
    private List<String> requiredFields;

    @Column(name = "offline_capable", nullable = false)
    @Builder.Default
    private Boolean offlineCapable = false;

    @Column(name = "form_version", nullable = false)
    @Builder.Default
    private Integer formVersion = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
