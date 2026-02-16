package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.quality.domain.ToleranceCheck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractToleranceCheckRepository extends JpaRepository<ToleranceCheck, UUID> {

    Page<ToleranceCheck> findByToleranceRuleIdAndDeletedFalse(UUID toleranceRuleId, Pageable pageable);

    List<ToleranceCheck> findByToleranceRuleIdAndDeletedFalseOrderByCheckedAtDesc(UUID toleranceRuleId);

    long countByToleranceRuleIdAndIsWithinToleranceFalseAndDeletedFalse(UUID toleranceRuleId);
}
