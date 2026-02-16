package com.privod.platform.modules.taxRisk.repository;

import com.privod.platform.modules.taxRisk.domain.MitigationStatus;
import com.privod.platform.modules.taxRisk.domain.TaxRiskMitigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxRiskMitigationRepository extends JpaRepository<TaxRiskMitigation, UUID> {

    List<TaxRiskMitigation> findByAssessmentIdAndDeletedFalse(UUID assessmentId);

    List<TaxRiskMitigation> findByAssessmentIdAndStatusAndDeletedFalse(UUID assessmentId, MitigationStatus status);

    List<TaxRiskMitigation> findByFactorIdAndDeletedFalse(UUID factorId);

    long countByAssessmentIdAndDeletedFalse(UUID assessmentId);
}
