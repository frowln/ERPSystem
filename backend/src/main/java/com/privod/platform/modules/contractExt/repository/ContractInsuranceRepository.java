package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ContractInsurance;
import com.privod.platform.modules.contractExt.domain.InsuranceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractInsuranceRepository extends JpaRepository<ContractInsurance, UUID> {

    Page<ContractInsurance> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractInsurance> findByContractIdAndDeletedFalseOrderByEndDateAsc(UUID contractId);

    long countByContractIdAndStatusAndDeletedFalse(UUID contractId, InsuranceStatus status);
}
