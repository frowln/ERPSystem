package com.privod.platform.modules.permission.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "field_access_rules", indexes = {
        @Index(name = "idx_far_model", columnList = "model_name"),
        @Index(name = "idx_far_group", columnList = "group_id"),
        @Index(name = "idx_far_model_field", columnList = "model_name, field_name")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_field_access", columnNames = {"model_name", "field_name", "group_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldAccess extends BaseEntity {

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "can_read", nullable = false)
    @Builder.Default
    private boolean canRead = true;

    @Column(name = "can_write", nullable = false)
    @Builder.Default
    private boolean canWrite = false;
}
