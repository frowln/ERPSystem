package com.privod.platform.modules.crm.domain;

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
@Table(name = "crm_leads", indexes = {
        @Index(name = "idx_crm_lead_org", columnList = "organization_id"),
        @Index(name = "idx_crm_lead_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_crm_lead_status", columnList = "status"),
        @Index(name = "idx_crm_lead_stage", columnList = "stage_id"),
        @Index(name = "idx_crm_lead_assigned", columnList = "assigned_to_id"),
        @Index(name = "idx_crm_lead_priority", columnList = "priority"),
        @Index(name = "idx_crm_lead_project", columnList = "project_id"),
        @Index(name = "idx_crm_lead_company", columnList = "company_name"),
        @Index(name = "idx_crm_lead_won_date", columnList = "won_date"),
        @Index(name = "idx_crm_lead_next_activity", columnList = "next_activity_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmLead extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "partner_name", length = 300)
    private String partnerName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "company_name", length = 500)
    private String companyName;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "medium", length = 100)
    private String medium;

    @Column(name = "stage_id")
    private UUID stageId;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "expected_revenue", precision = 18, scale = 2)
    private BigDecimal expectedRevenue;

    @Column(name = "probability")
    @Builder.Default
    private int probability = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private LeadPriority priority = LeadPriority.NORMAL;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "lost_reason", columnDefinition = "TEXT")
    private String lostReason;

    @Column(name = "won_date")
    private LocalDate wonDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "next_activity_date")
    private LocalDate nextActivityDate;

    public boolean isOpen() {
        return status != LeadStatus.WON && status != LeadStatus.LOST;
    }

    public BigDecimal getWeightedRevenue() {
        if (expectedRevenue == null) return BigDecimal.ZERO;
        return expectedRevenue.multiply(BigDecimal.valueOf(probability))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }
}
