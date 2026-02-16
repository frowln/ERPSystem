package com.privod.platform.modules.permission.domain;

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
@Table(name = "permission_groups", indexes = {
        @Index(name = "idx_pg_name", columnList = "name", unique = true),
        @Index(name = "idx_pg_category", columnList = "category"),
        @Index(name = "idx_pg_parent", columnList = "parent_group_id"),
        @Index(name = "idx_pg_sequence", columnList = "sequence")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionGroup extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "parent_group_id")
    private UUID parentGroupId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private int sequence = 10;
}
