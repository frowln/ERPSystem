package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.EstimateVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EstimateVersionRepository extends JpaRepository<EstimateVersion, UUID> {

    List<EstimateVersion> findByEstimateIdOrderByCreatedAtDesc(UUID estimateId);

    Optional<EstimateVersion> findByEstimateIdAndIsCurrentTrue(UUID estimateId);

    long countByEstimateId(UUID estimateId);
}
