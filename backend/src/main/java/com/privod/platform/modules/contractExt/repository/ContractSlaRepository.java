package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ContractSla;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractSlaRepository extends JpaRepository<ContractSla, UUID> {

    Page<ContractSla> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractSla> findByContractIdAndIsActiveTrueAndDeletedFalse(UUID contractId);

    long countByContractIdAndDeletedFalse(UUID contractId);
}
