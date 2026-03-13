package com.privod.platform.modules.selfEmployed.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "completion_acts", indexes = {
        @Index(name = "idx_ca_organization", columnList = "organization_id"),
        @Index(name = "idx_ca_worker", columnList = "worker_id"),
        @Index(name = "idx_ca_project", columnList = "project_id"),
        @Index(name = "idx_ca_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionAct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private SelfEmployedWorker worker;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "act_number", nullable = false, length = 50)
    private String actNumber;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "period", length = 7)
    private String period;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ActStatus status = ActStatus.DRAFT;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "deleted")
    @Builder.Default
    private boolean deleted = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public void softDelete() {
        this.deleted = true;
    }
}
