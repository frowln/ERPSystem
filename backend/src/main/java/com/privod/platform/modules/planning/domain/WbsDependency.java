package com.privod.platform.modules.planning.domain;

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
@Table(name = "wbs_dependencies", indexes = {
        @Index(name = "idx_wbs_dep_predecessor", columnList = "predecessor_id"),
        @Index(name = "idx_wbs_dep_successor", columnList = "successor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WbsDependency extends BaseEntity {

    @Column(name = "predecessor_id", nullable = false)
    private UUID predecessorId;

    @Column(name = "successor_id", nullable = false)
    private UUID successorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "dependency_type", nullable = false, length = 30)
    @Builder.Default
    private DependencyType dependencyType = DependencyType.FINISH_TO_START;

    @Column(name = "lag_days", nullable = false)
    @Builder.Default
    private Integer lagDays = 0;
}
