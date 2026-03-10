package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.LocalEstimateSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocalEstimateSummaryRepository extends JpaRepository<LocalEstimateSummary, UUID> {

    Optional<LocalEstimateSummary> findByEstimateId(UUID estimateId);
}
