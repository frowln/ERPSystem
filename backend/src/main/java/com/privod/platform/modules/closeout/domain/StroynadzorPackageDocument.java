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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stroynadzor_package_documents", indexes = {
        @Index(name = "idx_spd_package", columnList = "package_id"),
        @Index(name = "idx_spd_category", columnList = "document_category"),
        @Index(name = "idx_spd_doc", columnList = "document_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StroynadzorPackageDocument extends BaseEntity {

    @Column(name = "package_id", nullable = false)
    private UUID packageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_category", nullable = false, length = 50)
    private DocumentCategory documentCategory;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "document_number", length = 200)
    private String documentNumber;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "section_number", length = 20)
    private String sectionNumber;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(name = "has_signature")
    @Builder.Default
    private boolean hasSignature = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PackageDocumentStatus status = PackageDocumentStatus.INCLUDED;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
