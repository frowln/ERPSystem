package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.ProfitabilityForecast;
import com.privod.platform.modules.costManagement.domain.ProfitabilityRiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfitabilityForecastRepository extends JpaRepository<ProfitabilityForecast, UUID>,
        JpaSpecificationExecutor<ProfitabilityForecast> {

    Page<ProfitabilityForecast> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Optional<ProfitabilityForecast> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    Page<ProfitabilityForecast> findByOrganizationIdAndRiskLevelAndDeletedFalse(UUID organizationId,
                                                                                  ProfitabilityRiskLevel riskLevel,
                                                                                  Pageable pageable);

    long countByOrganizationIdAndRiskLevelAndDeletedFalse(UUID organizationId, ProfitabilityRiskLevel riskLevel);

    List<ProfitabilityForecast> findAllByOrganizationIdAndDeletedFalse(UUID organizationId);
}
