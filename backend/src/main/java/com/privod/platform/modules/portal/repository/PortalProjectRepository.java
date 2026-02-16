package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.PortalProject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortalProjectRepository extends JpaRepository<PortalProject, UUID> {

    List<PortalProject> findByPortalUserIdAndDeletedFalse(UUID portalUserId);

    Page<PortalProject> findByPortalUserIdAndDeletedFalse(UUID portalUserId, Pageable pageable);

    Optional<PortalProject> findByPortalUserIdAndProjectIdAndDeletedFalse(UUID portalUserId, UUID projectId);

    List<PortalProject> findByProjectIdAndDeletedFalse(UUID projectId);

    boolean existsByPortalUserIdAndProjectIdAndDeletedFalse(UUID portalUserId, UUID projectId);
}
