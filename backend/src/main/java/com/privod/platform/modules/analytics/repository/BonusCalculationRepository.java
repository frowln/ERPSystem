package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.BonusCalculation;
import com.privod.platform.modules.analytics.domain.BonusStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BonusCalculationRepository extends JpaRepository<BonusCalculation, UUID> {

    Page<BonusCalculation> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    List<BonusCalculation> findByPeriodAndDeletedFalse(String period);

    Page<BonusCalculation> findByStatusAndDeletedFalse(BonusStatus status, Pageable pageable);

    Page<BonusCalculation> findByDeletedFalse(Pageable pageable);
}
