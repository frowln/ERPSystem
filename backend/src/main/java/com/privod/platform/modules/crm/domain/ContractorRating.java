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
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "contractor_ratings", indexes = {
        @Index(name = "idx_contractor_ratings_cp", columnList = "counterparty_id"),
        @Index(name = "idx_contractor_ratings_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractorRating extends BaseEntity {

    @Column(name = "counterparty_id", nullable = false)
    private UUID counterpartyId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "rated_by")
    private UUID ratedBy;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "timeliness_score")
    private Integer timelinessScore;

    @Column(name = "safety_score")
    private Integer safetyScore;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "price_score")
    private Integer priceScore;

    @Generated(event = EventType.INSERT)
    @Column(name = "overall_score", insertable = false, updatable = false, precision = 3, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_blacklisted", nullable = false)
    @Builder.Default
    private boolean blacklisted = false;

    @Column(name = "blacklist_reason", columnDefinition = "TEXT")
    private String blacklistReason;

    @Column(name = "organization_id")
    private UUID organizationId;
}
