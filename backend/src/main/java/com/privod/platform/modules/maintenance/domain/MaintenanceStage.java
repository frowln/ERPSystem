package com.privod.platform.modules.maintenance.domain;

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

@Entity
@Table(name = "maintenance_stages", indexes = {
        @Index(name = "idx_maint_stage_sequence", columnList = "sequence"),
        @Index(name = "idx_maint_stage_closed", columnList = "is_closed")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceStage extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "sequence", nullable = false)
    private int sequence;

    @Column(name = "is_closed", nullable = false)
    @Builder.Default
    private boolean isClosed = false;

    @Column(name = "description", length = 1000)
    private String description;
}
