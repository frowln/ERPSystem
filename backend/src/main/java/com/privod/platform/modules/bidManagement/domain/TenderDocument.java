package com.privod.platform.modules.bidManagement.domain;

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

/**
 * Структурированный тендерный документ (P2-CRM-2).
 * <p>
 * Заменяет хранение тендерных документов в JSONB внутри BidPackage/BidComparison
 * нормализованной таблицей с явной типизацией и связями.
 */
@Entity
@Table(name = "tender_documents", indexes = {
        @Index(name = "idx_tender_docs_bid_pkg", columnList = "bid_package_id"),
        @Index(name = "idx_tender_docs_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderDocument extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    /** Ссылка на тендерный пакет (опционально: документ может быть шаблоном без пакета). */
    @Column(name = "bid_package_id")
    private UUID bidPackageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private TenderDocumentType documentType;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    /** UUID вложения в MinIO/file_attachments (опционально). */
    @Column(name = "file_attachment_id")
    private UUID fileAttachmentId;

    /** Является ли документ обязательным к подаче участником. */
    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean isRequired = false;

    /** Дата и время фактической подачи документа участником. */
    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /** Порядок отображения в списке документов пакета. */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
