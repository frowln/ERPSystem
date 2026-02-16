package com.privod.platform.modules.kep.domain;

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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kep_signing_requests", indexes = {
        @Index(name = "idx_kep_req_document", columnList = "document_model, document_id"),
        @Index(name = "idx_kep_req_requester", columnList = "requester_id"),
        @Index(name = "idx_kep_req_signer", columnList = "signer_id"),
        @Index(name = "idx_kep_req_status", columnList = "status"),
        @Index(name = "idx_kep_req_due_date", columnList = "due_date"),
        @Index(name = "idx_kep_req_priority", columnList = "priority")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KepSigningRequest extends BaseEntity {

    @Column(name = "document_model", nullable = false, length = 100)
    private String documentModel;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "document_title", length = 500)
    private String documentTitle;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "signer_id", nullable = false)
    private UUID signerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private KepSigningStatus status = KepSigningStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private KepPriority priority = KepPriority.NORMAL;

    public boolean isOverdue() {
        return dueDate != null && LocalDate.now().isAfter(dueDate)
                && status == KepSigningStatus.PENDING;
    }
}
