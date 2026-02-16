package com.privod.platform.modules.integration.domain;

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
@Table(name = "sync_mappings", indexes = {
        @Index(name = "idx_sm_endpoint", columnList = "endpoint_id"),
        @Index(name = "idx_sm_local_entity", columnList = "local_entity_type"),
        @Index(name = "idx_sm_remote_entity", columnList = "remote_entity_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncMapping extends BaseEntity {

    @Column(name = "endpoint_id", nullable = false)
    private UUID endpointId;

    @Column(name = "local_entity_type", nullable = false, length = 100)
    private String localEntityType;

    @Column(name = "local_field_name", nullable = false, length = 100)
    private String localFieldName;

    @Column(name = "remote_entity_type", nullable = false, length = 100)
    private String remoteEntityType;

    @Column(name = "remote_field_name", nullable = false, length = 100)
    private String remoteFieldName;

    @Column(name = "transform_expression", length = 500)
    private String transformExpression;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    @Builder.Default
    private MappingDirection direction = MappingDirection.BOTH;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean isRequired = false;
}
