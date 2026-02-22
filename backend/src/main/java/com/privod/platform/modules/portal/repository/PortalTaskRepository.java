package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalTask;
import com.privod.platform.modules.portal.domain.PortalTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PortalTaskRepository extends JpaRepository<PortalTask, UUID> {

    Page<PortalTask> findByPortalUserIdAndDeletedFalse(UUID portalUserId, Pageable pageable);

    Page<PortalTask> findByPortalUserIdAndStatusAndDeletedFalse(
            UUID portalUserId, PortalTaskStatus status, Pageable pageable);

    Page<PortalTask> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PortalTask> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    long countByPortalUserIdAndStatusAndDeletedFalse(UUID portalUserId, PortalTaskStatus status);
}
