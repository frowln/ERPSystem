package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocalEstimateRepository extends JpaRepository<LocalEstimate, UUID> {

    Page<LocalEstimate> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    Page<LocalEstimate> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId, Pageable pageable);

    Page<LocalEstimate> findByOrganizationIdAndStatusAndDeletedFalse(UUID orgId, LocalEstimateStatus status, Pageable pageable);

    /** P1-WAR-2: Get all estimates for a project (for consumption plan aggregation). */
    List<LocalEstimate> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId);
}
