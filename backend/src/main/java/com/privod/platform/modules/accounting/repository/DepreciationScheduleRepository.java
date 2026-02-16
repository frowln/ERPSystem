package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.DepreciationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DepreciationScheduleRepository extends JpaRepository<DepreciationSchedule, UUID> {

    List<DepreciationSchedule> findByAssetIdAndDeletedFalseOrderByCreatedAtAsc(UUID assetId);

    List<DepreciationSchedule> findByPeriodIdAndDeletedFalse(UUID periodId);
}
