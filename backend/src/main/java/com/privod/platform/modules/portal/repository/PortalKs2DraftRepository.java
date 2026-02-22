package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalKs2Draft;
import com.privod.platform.modules.portal.domain.PortalKs2DraftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PortalKs2DraftRepository extends JpaRepository<PortalKs2Draft, UUID> {

    Page<PortalKs2Draft> findByPortalUserIdAndDeletedFalse(UUID portalUserId, Pageable pageable);

    Page<PortalKs2Draft> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PortalKs2Draft> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<PortalKs2Draft> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId, PortalKs2DraftStatus status, Pageable pageable);

    Page<PortalKs2Draft> findByOrganizationIdAndStatusInAndDeletedFalse(
            UUID organizationId, java.util.Collection<PortalKs2DraftStatus> statuses, Pageable pageable);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, PortalKs2DraftStatus status);
}
