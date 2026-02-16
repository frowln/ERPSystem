package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ClaimStatus;
import com.privod.platform.modules.contractExt.domain.ContractClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractClaimRepository extends JpaRepository<ContractClaim, UUID> {

    Page<ContractClaim> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractClaim> findByContractIdAndDeletedFalseOrderByFiledAtDesc(UUID contractId);

    long countByContractIdAndDeletedFalse(UUID contractId);

    long countByContractIdAndStatusAndDeletedFalse(UUID contractId, ClaimStatus status);

    @Query(value = "SELECT nextval('contract_claim_code_seq')", nativeQuery = true)
    long getNextClaimCodeSequence();

    @Query("SELECT c.status, COUNT(c) FROM ContractClaim c " +
            "WHERE c.contractId = :contractId AND c.deleted = false GROUP BY c.status")
    List<Object[]> countByStatusAndContractId(@Param("contractId") UUID contractId);
}
