package com.privod.platform.modules.russianDoc.domain;

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
import java.util.UUID;

/**
 * Запрос на подписание документа КЭП.
 * Маршрутизация процесса подписания между участниками.
 */
@Entity
@Table(name = "kep_signature_request", indexes = {
        @Index(name = "idx_kep_req_doc", columnList = "document_type, document_id"),
        @Index(name = "idx_kep_sig_req_status", columnList = "status"),
        @Index(name = "idx_kep_req_to", columnList = "requested_to_id"),
        @Index(name = "idx_kep_req_due", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KepSignatureRequest extends BaseEntity {

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "requested_by_id", nullable = false)
    private UUID requestedById;

    @Column(name = "requested_to_id", nullable = false)
    private UUID requestedToId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private KepSignatureRequestStatus status = KepSignatureRequestStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "comment", length = 2000)
    private String comment;

    public boolean isOverdue() {
        return dueDate != null
                && dueDate.isBefore(LocalDate.now())
                && status == KepSignatureRequestStatus.PENDING;
    }
}
