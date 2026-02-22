package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.PredictionModel;
import com.privod.platform.modules.analytics.domain.PredictionModelType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PredictionModelRepository extends JpaRepository<PredictionModel, UUID> {

    Page<PredictionModel> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<PredictionModel> findByOrganizationIdAndModelTypeAndIsActiveTrueAndDeletedFalse(
            UUID organizationId, PredictionModelType modelType);

    Optional<PredictionModel> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<PredictionModel> findByOrganizationIdAndIsActiveTrueAndDeletedFalse(UUID organizationId);
}
