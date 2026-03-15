package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.FinancingScheduleEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FinancingScheduleEntryRepository extends JpaRepository<FinancingScheduleEntry, UUID> {

    Page<FinancingScheduleEntry> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<FinancingScheduleEntry> findByContractIdAndDeletedFalseOrderByPeriodDateAsc(UUID contractId);
}
