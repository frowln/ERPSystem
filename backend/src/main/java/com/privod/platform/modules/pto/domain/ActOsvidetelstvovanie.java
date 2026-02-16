package com.privod.platform.modules.pto.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "acts_osvidetelstvovanie", indexes = {
        @Index(name = "idx_act_osvid_project", columnList = "project_id"),
        @Index(name = "idx_act_osvid_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActOsvidetelstvovanie extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 30)
    private WorkType workType;

    @Column(name = "volume", precision = 16, scale = 3)
    private BigDecimal volume;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private ActResult result;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ActOsvidetelstvovanieStatus status = ActOsvidetelstvovanieStatus.DRAFT;

    public boolean canTransitionTo(ActOsvidetelstvovanieStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
