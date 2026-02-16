package com.privod.platform.modules.crm.domain;

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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "crm_teams", indexes = {
        @Index(name = "idx_crm_team_leader", columnList = "leader_id"),
        @Index(name = "idx_crm_team_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmTeam extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "leader_id")
    private UUID leaderId;

    @Column(name = "member_ids", columnDefinition = "TEXT")
    private String memberIds;

    @Column(name = "target_revenue", precision = 18, scale = 2)
    private BigDecimal targetRevenue;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
