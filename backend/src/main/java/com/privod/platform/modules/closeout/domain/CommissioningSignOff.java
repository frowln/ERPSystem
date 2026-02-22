package com.privod.platform.modules.closeout.domain;

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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commissioning_sign_offs", indexes = {
        @Index(name = "idx_comm_signoff_checklist", columnList = "checklist_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissioningSignOff extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "checklist_id", nullable = false)
    private UUID checklistId;

    @Column(name = "signer_name", nullable = false, length = 255)
    private String signerName;

    @Column(name = "signer_role", length = 100)
    private String signerRole;

    @Column(name = "signer_organization", length = 255)
    private String signerOrganization;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 30)
    @Builder.Default
    private SignOffDecision decision = SignOffDecision.PENDING;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "signed_at")
    private Instant signedAt;
}
