package com.privod.platform.modules.dataExchange.domain;

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
@Table(name = "import_mappings", indexes = {
        @Index(name = "idx_import_mapping_entity", columnList = "entity_type"),
        @Index(name = "idx_import_mapping_default", columnList = "is_default")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportMapping extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "mapping_config", columnDefinition = "JSONB")
    private String mappingConfig;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "created_by_id")
    private UUID createdById;
}
