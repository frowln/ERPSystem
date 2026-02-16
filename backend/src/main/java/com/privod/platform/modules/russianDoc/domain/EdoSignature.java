package com.privod.platform.modules.russianDoc.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "edo_signatures", indexes = {
        @Index(name = "idx_edo_sig_document", columnList = "edo_document_id"),
        @Index(name = "idx_edo_sig_signer", columnList = "signer_id"),
        @Index(name = "idx_edo_sig_cert", columnList = "certificate_serial_number"),
        @Index(name = "idx_edo_sig_signed_at", columnList = "signed_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoSignature extends BaseEntity {

    @Column(name = "edo_document_id", nullable = false)
    private UUID edoDocumentId;

    @Column(name = "signer_id")
    private UUID signerId;

    @Column(name = "signer_name", nullable = false, length = 500)
    private String signerName;

    @Column(name = "signer_position", length = 500)
    private String signerPosition;

    @Column(name = "certificate_serial_number", length = 255)
    private String certificateSerialNumber;

    @Column(name = "signed_at", nullable = false)
    private Instant signedAt;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    @Column(name = "is_valid", nullable = false)
    @Builder.Default
    private boolean isValid = true;

    @Column(name = "validation_result", length = 2000)
    private String validationResult;
}
