package com.privod.platform.modules.ai.classification.repository;

import com.privod.platform.modules.ai.classification.domain.DocumentClassType;
import com.privod.platform.modules.ai.classification.domain.DocumentClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentClassificationRepository extends JpaRepository<DocumentClassification, UUID> {

    Optional<DocumentClassification> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<DocumentClassification> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<DocumentClassification> findByOrganizationIdAndDetectedTypeAndDeletedFalse(
            UUID organizationId, DocumentClassType detectedType, Pageable pageable);

    Optional<DocumentClassification> findByOrganizationIdAndDocumentIdAndDeletedFalse(
            UUID organizationId, UUID documentId);

    List<DocumentClassification> findByOrganizationIdAndConfirmedFalseAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndConfirmedTrueAndDeletedFalse(UUID organizationId);
}
