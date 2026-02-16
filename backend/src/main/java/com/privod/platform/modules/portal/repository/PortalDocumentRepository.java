package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortalDocumentRepository extends JpaRepository<PortalDocument, UUID> {

    Page<PortalDocument> findByPortalUserIdAndDeletedFalse(UUID portalUserId, Pageable pageable);

    List<PortalDocument> findByPortalUserIdAndProjectIdAndDeletedFalse(UUID portalUserId, UUID projectId);

    Optional<PortalDocument> findByPortalUserIdAndDocumentIdAndDeletedFalse(UUID portalUserId, UUID documentId);

    @Query("SELECT pd FROM PortalDocument pd WHERE pd.deleted = false AND " +
            "pd.portalUserId = :portalUserId AND " +
            "(pd.expiresAt IS NULL OR pd.expiresAt > CURRENT_TIMESTAMP)")
    Page<PortalDocument> findActiveByPortalUserId(@Param("portalUserId") UUID portalUserId, Pageable pageable);
}
