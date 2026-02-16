package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ContractGuarantee;
import com.privod.platform.modules.contractExt.domain.GuaranteeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractGuaranteeRepository extends JpaRepository<ContractGuarantee, UUID> {

    Page<ContractGuarantee> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractGuarantee> findByContractIdAndDeletedFalseOrderByExpiresAtAsc(UUID contractId);

    long countByContractIdAndStatusAndDeletedFalse(UUID contractId, GuaranteeStatus status);
}
