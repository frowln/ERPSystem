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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hidden_work_act_signatures", indexes = {
        @Index(name = "idx_hwa_sig_act", columnList = "act_id"),
        @Index(name = "idx_hwa_sig_role", columnList = "signer_role"),
        @Index(name = "idx_hwa_sig_user", columnList = "signer_user_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HiddenWorkActSignature extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "act_id", nullable = false)
    private UUID actId;

    @Column(name = "signer_user_id", nullable = false)
    private UUID signerUserId;

    @Column(name = "signer_name", nullable = false, length = 300)
    private String signerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "signer_role", nullable = false, length = 50)
    private SignerRole signerRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SignatureStatus status = SignatureStatus.PENDING;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "kep_signature_id")
    private UUID kepSignatureId;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "comment_text", columnDefinition = "TEXT")
    private String commentText;

    public enum SignerRole {
        DEVELOPER_REPRESENTATIVE,
        CONTRACTOR_REPRESENTATIVE,
        DESIGN_SUPERVISION,
        TECHNICAL_SUPERVISION,
        OTHER_INSPECTOR
    }

    public enum SignatureStatus {
        PENDING,
        SIGNED,
        REJECTED
    }
}
