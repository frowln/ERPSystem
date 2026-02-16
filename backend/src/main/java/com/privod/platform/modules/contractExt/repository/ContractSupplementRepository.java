package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.ContractSupplement;
import com.privod.platform.modules.contractExt.domain.SupplementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ContractSupplementRepository extends JpaRepository<ContractSupplement, UUID> {

    Page<ContractSupplement> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ContractSupplement> findByContractIdAndDeletedFalseOrderBySupplementDateDesc(UUID contractId);

    long countByContractIdAndDeletedFalse(UUID contractId);

    @Query("SELECT COALESCE(SUM(s.amountChange), 0) FROM ContractSupplement s " +
            "WHERE s.contractId = :contractId AND s.status = :status AND s.deleted = false")
    BigDecimal sumAmountChangeByContractIdAndStatus(@Param("contractId") UUID contractId,
                                                     @Param("status") SupplementStatus status);
}
