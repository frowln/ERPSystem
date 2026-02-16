package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.SbisDirection;
import com.privod.platform.modules.integration.domain.SbisDocument;
import com.privod.platform.modules.integration.domain.SbisDocumentStatus;
import com.privod.platform.modules.integration.domain.SbisDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SbisDocumentRepository extends JpaRepository<SbisDocument, UUID> {

    Page<SbisDocument> findByDeletedFalse(Pageable pageable);

    Page<SbisDocument> findByDirectionAndDeletedFalse(SbisDirection direction, Pageable pageable);

    Page<SbisDocument> findByStatusAndDeletedFalse(SbisDocumentStatus status, Pageable pageable);

    Page<SbisDocument> findByDocumentTypeAndDeletedFalse(SbisDocumentType documentType, Pageable pageable);

    Page<SbisDocument> findByPartnerInnAndDeletedFalse(String partnerInn, Pageable pageable);

    Optional<SbisDocument> findBySbisIdAndDeletedFalse(String sbisId);

    Optional<SbisDocument> findByInternalDocumentIdAndDeletedFalse(UUID internalDocumentId);
}
