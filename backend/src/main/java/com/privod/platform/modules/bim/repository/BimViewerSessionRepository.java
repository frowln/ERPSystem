package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimViewerSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BimViewerSessionRepository extends JpaRepository<BimViewerSession, UUID> {

    Page<BimViewerSession> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<BimViewerSession> findByOrganizationIdAndModelIdAndDeletedFalse(UUID organizationId, UUID modelId, Pageable pageable);

    Optional<BimViewerSession> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<BimViewerSession> findByOrganizationIdAndUserIdAndEndedAtIsNullAndDeletedFalse(UUID organizationId, UUID userId);
}
