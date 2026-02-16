package com.privod.platform.modules.contract.repository;

import com.privod.platform.modules.contract.domain.ApprovalStatus;
import com.privod.platform.modules.contract.domain.ContractApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractApprovalRepository extends JpaRepository<ContractApproval, UUID> {

    List<ContractApproval> findByContractIdOrderByCreatedAtAsc(UUID contractId);

    Optional<ContractApproval> findByContractIdAndStage(UUID contractId, String stage);

    boolean existsByContractIdAndStageAndStatus(UUID contractId, String stage, ApprovalStatus status);
}
