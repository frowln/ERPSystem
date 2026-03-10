package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.VolumeCalculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VolumeCalculationRepository extends JpaRepository<VolumeCalculation, UUID> {

    List<VolumeCalculation> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);

    List<VolumeCalculation> findByOrganizationIdAndProjectIdAndDeletedFalseOrderByCreatedAtDesc(
            UUID organizationId, UUID projectId);
}
