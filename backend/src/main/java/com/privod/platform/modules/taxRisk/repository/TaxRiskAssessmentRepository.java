package com.privod.platform.modules.taxRisk.repository;

import com.privod.platform.modules.taxRisk.domain.AssessmentStatus;
import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import com.privod.platform.modules.taxRisk.domain.TaxRiskAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRiskAssessmentRepository extends JpaRepository<TaxRiskAssessment, UUID> {

    Page<TaxRiskAssessment> findByDeletedFalse(Pageable pageable);

    Page<TaxRiskAssessment> findByStatusAndDeletedFalse(AssessmentStatus status, Pageable pageable);

    Page<TaxRiskAssessment> findByRiskLevelAndDeletedFalse(RiskLevel riskLevel, Pageable pageable);

    Page<TaxRiskAssessment> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<TaxRiskAssessment> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, AssessmentStatus status, Pageable pageable);

    Page<TaxRiskAssessment> findByOrganizationIdAndRiskLevelAndDeletedFalse(UUID organizationId, RiskLevel riskLevel, Pageable pageable);

    List<TaxRiskAssessment> findByProjectIdAndDeletedFalse(UUID projectId);

    List<TaxRiskAssessment> findByProjectIdAndOrganizationIdAndDeletedFalse(UUID projectId, UUID organizationId);

    List<TaxRiskAssessment> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<TaxRiskAssessment> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    boolean existsByCodeAndDeletedFalse(String code);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
