package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.ClientDocumentSignature;
import com.privod.platform.modules.portal.domain.SignatureStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClientDocumentSignatureRepository extends JpaRepository<ClientDocumentSignature, UUID> {

    Page<ClientDocumentSignature> findByPortalUserIdAndDeletedFalse(
            UUID portalUserId, Pageable pageable);

    Page<ClientDocumentSignature> findByPortalUserIdAndSignatureStatusAndDeletedFalse(
            UUID portalUserId, SignatureStatus status, Pageable pageable);

    Page<ClientDocumentSignature> findByProjectIdAndDeletedFalse(
            UUID projectId, Pageable pageable);

    long countByPortalUserIdAndSignatureStatusAndDeletedFalse(
            UUID portalUserId, SignatureStatus status);

    @Query("SELECT s FROM ClientDocumentSignature s WHERE s.signatureStatus = 'PENDING' " +
            "AND s.expiresAt IS NOT NULL AND s.expiresAt < :now AND s.deleted = false")
    List<ClientDocumentSignature> findExpiredPending(@Param("now") Instant now);
}
