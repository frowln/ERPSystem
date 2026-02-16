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

import java.util.UUID;

@Entity
@Table(name = "maintenance_teams", indexes = {
        @Index(name = "idx_maint_team_name", columnList = "name"),
        @Index(name = "idx_maint_team_lead", columnList = "lead_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceTeam extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "member_ids", columnDefinition = "TEXT")
    private String memberIds;
}
