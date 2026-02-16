package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ContractMilestone;
import com.privod.platform.modules.contractExt.domain.MilestoneStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractMilestoneRepository extends JpaRepository<ContractMilestone, UUID> {

    Page<ContractMilestone> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractMilestone> findByContractIdAndDeletedFalseOrderByDueDateAsc(UUID contractId);

    long countByContractIdAndStatusAndDeletedFalse(UUID contractId, MilestoneStatus status);
}
