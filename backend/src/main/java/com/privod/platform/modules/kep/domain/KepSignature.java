package com.privod.platform.modules.kep.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kep_signatures", indexes = {
        @Index(name = "idx_kep_sig_certificate", columnList = "certificate_id"),
        @Index(name = "idx_kep_sig_document", columnList = "document_model, document_id"),
        @Index(name = "idx_kep_sig_signed_at", columnList = "signed_at"),
        @Index(name = "idx_kep_sig_hash", columnList = "signature_hash")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KepSignature extends BaseEntity {

    @Column(name = "certificate_id", nullable = false)
    private UUID certificateId;

    @Column(name = "document_model", nullable = false, length = 100)
    private String documentModel;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "signed_at", nullable = false)
    private LocalDateTime signedAt;

    @Column(name = "signature_data", columnDefinition = "TEXT", nullable = false)
    private String signatureData;

    @Column(name = "signature_hash", length = 255)
    private String signatureHash;

    @Column(name = "is_valid", nullable = false)
    @Builder.Default
    private boolean valid = true;

    @Column(name = "validation_message", columnDefinition = "TEXT")
    private String validationMessage;

    @Column(name = "signer_name", length = 500)
    private String signerName;

    @Column(name = "signer_position", length = 300)
    private String signerPosition;
}
