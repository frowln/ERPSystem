package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.AsBuiltLinkStatus;
import com.privod.platform.modules.closeout.domain.AsBuiltWbsLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsBuiltWbsLinkRepository extends JpaRepository<AsBuiltWbsLink, UUID>,
        JpaSpecificationExecutor<AsBuiltWbsLink> {

    List<AsBuiltWbsLink> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId);

    List<AsBuiltWbsLink> findByOrganizationIdAndWbsNodeIdAndDeletedFalse(UUID orgId, UUID wbsNodeId);

    List<AsBuiltWbsLink> findByOrganizationIdAndWbsNodeIdInAndDeletedFalse(UUID orgId, List<UUID> wbsNodeIds);

    long countByOrganizationIdAndProjectIdAndStatusAndDeletedFalse(UUID orgId, UUID projectId, AsBuiltLinkStatus status);
}
