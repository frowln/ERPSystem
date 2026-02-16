package com.privod.platform.modules.russianDoc.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Сгенерированный ЭДО-документ (XML/PDF).
 * Результат генерации XML по шаблону на основе исходного первичного документа.
 */
@Entity
@Table(name = "edo_generated_document", indexes = {
        @Index(name = "idx_edo_gen_template", columnList = "template_id"),
        @Index(name = "idx_edo_gen_source", columnList = "source_document_type, source_document_id"),
        @Index(name = "idx_edo_gen_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoGeneratedDocument extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "template_id", nullable = false)
    private EdoTemplate template;

    @Column(name = "source_document_type", nullable = false, length = 100)
    private String sourceDocumentType;

    @Column(name = "source_document_id", nullable = false)
    private UUID sourceDocumentId;

    @Column(name = "generated_xml", columnDefinition = "TEXT")
    private String generatedXml;

    @Column(name = "generated_pdf_url", length = 2000)
    private String generatedPdfUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EdoDocumentStatus status = EdoDocumentStatus.GENERATED;
}
