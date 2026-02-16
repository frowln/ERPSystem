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
@Table(name = "model_access_rules", indexes = {
        @Index(name = "idx_mar_model", columnList = "model_name"),
        @Index(name = "idx_mar_group", columnList = "group_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_model_access_model_group", columnNames = {"model_name", "group_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelAccess extends BaseEntity {

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "can_read", nullable = false)
    @Builder.Default
    private boolean canRead = false;

    @Column(name = "can_create", nullable = false)
    @Builder.Default
    private boolean canCreate = false;

    @Column(name = "can_update", nullable = false)
    @Builder.Default
    private boolean canUpdate = false;

    @Column(name = "can_delete", nullable = false)
    @Builder.Default
    private boolean canDelete = false;

    public boolean hasAccess(AccessOperation operation) {
        return switch (operation) {
            case READ -> canRead;
            case CREATE -> canCreate;
            case UPDATE -> canUpdate;
            case DELETE -> canDelete;
        };
    }
}
