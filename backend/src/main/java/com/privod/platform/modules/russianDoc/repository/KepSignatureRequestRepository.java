package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.KepSignatureRequest;
import com.privod.platform.modules.russianDoc.domain.KepSignatureRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KepSignatureRequestRepository extends JpaRepository<KepSignatureRequest, UUID> {

    Page<KepSignatureRequest> findByDeletedFalse(Pageable pageable);

    List<KepSignatureRequest> findByDocumentTypeAndDocumentIdAndDeletedFalse(String documentType, UUID documentId);

    List<KepSignatureRequest> findByRequestedToIdAndStatusAndDeletedFalse(
            UUID requestedToId, KepSignatureRequestStatus status);

    List<KepSignatureRequest> findByRequestedByIdAndDeletedFalseOrderByCreatedAtDesc(UUID requestedById);
}
