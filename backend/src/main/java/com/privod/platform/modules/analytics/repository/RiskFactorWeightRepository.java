package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.RiskFactorCategory;
import com.privod.platform.modules.analytics.domain.RiskFactorWeight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskFactorWeightRepository extends JpaRepository<RiskFactorWeight, UUID> {

    List<RiskFactorWeight> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    List<RiskFactorWeight> findByOrganizationIdAndFactorCategoryAndDeletedFalse(
            UUID organizationId, RiskFactorCategory factorCategory);

    Page<RiskFactorWeight> findByOrganizationIdAndDeletedFalseOrderByFactorCategoryAscWeightValueDesc(
            UUID organizationId, Pageable pageable);

    Optional<RiskFactorWeight> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Optional<RiskFactorWeight> findByOrganizationIdAndFactorNameAndDeletedFalse(
            UUID organizationId, String factorName);
}
