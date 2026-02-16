package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.legal.domain.LegalCase;
import com.privod.platform.modules.legal.domain.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractLegalCaseRepository extends JpaRepository<LegalCase, UUID>, JpaSpecificationExecutor<LegalCase> {

    Page<LegalCase> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<LegalCase> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<LegalCase> findByStatusAndDeletedFalse(CaseStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
