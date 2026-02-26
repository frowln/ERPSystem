package com.privod.platform.modules.portfolio.domain;

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
@Table(name = "opportunities", indexes = {
        @Index(name = "idx_opportunity_org", columnList = "organization_id"),
        @Index(name = "idx_opportunity_stage", columnList = "stage"),
        @Index(name = "idx_opportunity_client_type", columnList = "client_type"),
        @Index(name = "idx_opportunity_owner", columnList = "owner_id"),
        @Index(name = "idx_opportunity_expected_close", columnList = "expected_close_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Opportunity extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "client_name", length = 500)
    private String clientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", length = 30)
    private ClientType clientType;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 30)
    @Builder.Default
    private OpportunityStage stage = OpportunityStage.LEAD;

    @Column(name = "estimated_value", precision = 18, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "probability")
    private Integer probability;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "actual_close_date")
    private LocalDate actualCloseDate;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "region", length = 255)
    private String region;

    @Column(name = "project_type", length = 255)
    private String projectType;

    @Column(name = "lost_reason", columnDefinition = "TEXT")
    private String lostReason;

    @Column(name = "won_project_id")
    private UUID wonProjectId;

    @Column(name = "tags", columnDefinition = "JSONB")
    private String tags;

    @Column(name = "go_no_go_checklist", columnDefinition = "JSONB")
    private String goNoGoChecklist;

    @Column(name = "checklist_score")
    private Integer checklistScore;

    @Column(name = "analog_margin_percent", precision = 8, scale = 4)
    private BigDecimal analogMarginPercent;

    @Column(name = "analog_project_id")
    private UUID analogProjectId;

    public boolean canTransitionTo(OpportunityStage target) {
        return this.stage.canTransitionTo(target);
    }
}
