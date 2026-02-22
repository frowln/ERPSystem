package com.privod.platform.modules.ai.classification.repository;

import com.privod.platform.modules.ai.classification.domain.OcrProcessingJob;
import com.privod.platform.modules.ai.classification.domain.OcrStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OcrProcessingJobRepository extends JpaRepository<OcrProcessingJob, UUID> {

    Optional<OcrProcessingJob> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<OcrProcessingJob> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<OcrProcessingJob> findByStatusAndDeletedFalse(OcrStatus status);

    Optional<OcrProcessingJob> findByOrganizationIdAndDocumentIdAndDeletedFalse(
            UUID organizationId, UUID documentId);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, OcrStatus status);
}
