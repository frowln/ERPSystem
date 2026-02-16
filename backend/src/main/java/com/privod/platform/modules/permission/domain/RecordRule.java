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
@Table(name = "record_rules", indexes = {
        @Index(name = "idx_rr_model", columnList = "model_name"),
        @Index(name = "idx_rr_group", columnList = "group_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordRule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "domain_filter", nullable = false, columnDefinition = "JSONB")
    @Builder.Default
    private String domainFilter = "{}";

    @Column(name = "perm_read", nullable = false)
    @Builder.Default
    private boolean permRead = true;

    @Column(name = "perm_write", nullable = false)
    @Builder.Default
    private boolean permWrite = false;

    @Column(name = "perm_create", nullable = false)
    @Builder.Default
    private boolean permCreate = false;

    @Column(name = "perm_unlink", nullable = false)
    @Builder.Default
    private boolean permUnlink = false;

    @Column(name = "is_global", nullable = false)
    @Builder.Default
    private boolean isGlobal = false;
}
