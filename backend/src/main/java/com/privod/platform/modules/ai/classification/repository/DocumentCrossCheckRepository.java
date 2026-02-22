package com.privod.platform.modules.ai.classification.repository;

import com.privod.platform.modules.ai.classification.domain.CrossCheckStatus;
import com.privod.platform.modules.ai.classification.domain.DocumentCrossCheck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentCrossCheckRepository extends JpaRepository<DocumentCrossCheck, UUID> {

    Optional<DocumentCrossCheck> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<DocumentCrossCheck> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<DocumentCrossCheck> findByOrganizationIdAndSourceDocumentIdAndDeletedFalse(
            UUID organizationId, UUID sourceDocumentId);

    List<DocumentCrossCheck> findByOrganizationIdAndTargetDocumentIdAndDeletedFalse(
            UUID organizationId, UUID targetDocumentId);

    Page<DocumentCrossCheck> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, CrossCheckStatus status, Pageable pageable);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, CrossCheckStatus status);
}
