package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.ToleranceCheck;
import com.privod.platform.modules.quality.domain.ToleranceCheckStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToleranceCheckRepository extends JpaRepository<ToleranceCheck, UUID> {

    Page<ToleranceCheck> findByDeletedFalse(Pageable pageable);

    Page<ToleranceCheck> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ToleranceCheck> findByToleranceRuleIdAndDeletedFalse(UUID toleranceRuleId, Pageable pageable);

    List<ToleranceCheck> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ToleranceCheckStatus status);

    List<ToleranceCheck> findByProjectIdAndIsWithinToleranceFalseAndDeletedFalse(UUID projectId);

    long countByToleranceRuleIdAndDeletedFalse(UUID toleranceRuleId);
}
