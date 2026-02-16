package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.EdoDocumentType;
import com.privod.platform.modules.integration.domain.EdoProvider;
import com.privod.platform.modules.integration.domain.ExternalDocument;
import com.privod.platform.modules.integration.domain.ExternalDocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExternalDocumentRepository extends JpaRepository<ExternalDocument, UUID>,
        JpaSpecificationExecutor<ExternalDocument> {

    Optional<ExternalDocument> findByExternalIdAndProviderAndDeletedFalse(String externalId, EdoProvider provider);

    Page<ExternalDocument> findByDeletedFalse(Pageable pageable);

    Page<ExternalDocument> findByProviderAndDeletedFalse(EdoProvider provider, Pageable pageable);

    Page<ExternalDocument> findByStatusAndDeletedFalse(ExternalDocumentStatus status, Pageable pageable);

    Page<ExternalDocument> findByDocumentTypeAndDeletedFalse(EdoDocumentType documentType, Pageable pageable);

    List<ExternalDocument> findByRecipientInnAndStatusAndDeletedFalse(String recipientInn,
                                                                       ExternalDocumentStatus status);

    List<ExternalDocument> findByLinkedEntityTypeAndLinkedEntityIdAndDeletedFalse(
            String linkedEntityType, UUID linkedEntityId);

    Page<ExternalDocument> findByRecipientInnAndDeletedFalse(String recipientInn, Pageable pageable);

    long countByDeletedFalse();

    long countByStatusAndDeletedFalse(ExternalDocumentStatus status);

    Optional<ExternalDocument> findTopByDeletedFalseOrderByReceivedAtDesc();
}
