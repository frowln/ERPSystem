package com.privod.platform.modules.bidManagement.repository;

import com.privod.platform.modules.bidManagement.domain.TenderDocument;
import com.privod.platform.modules.bidManagement.domain.TenderDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Репозиторий тендерных документов (P2-CRM-2).
 */
@Repository
public interface TenderDocumentRepository extends JpaRepository<TenderDocument, UUID> {

    /**
     * Документы тендерного пакета, отсортированные по полю sortOrder.
     */
    List<TenderDocument> findByBidPackageIdAndDeletedFalseOrderBySortOrder(UUID bidPackageId);

    /**
     * Все активные документы организации с пагинацией.
     */
    Page<TenderDocument> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    /**
     * Проверяет, существует ли документ указанного типа в данном тендерном пакете.
     */
    boolean existsByBidPackageIdAndDocumentTypeAndDeletedFalse(UUID bidPackageId, TenderDocumentType documentType);
}
