package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.BankGuarantee;
import com.privod.platform.modules.finance.domain.GuaranteeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BankGuaranteeRepository extends JpaRepository<BankGuarantee, UUID> {

    Page<BankGuarantee> findByDeletedFalse(Pageable pageable);

    Page<BankGuarantee> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<BankGuarantee> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId);

    List<BankGuarantee> findByStatusAndExpiryDateBeforeAndDeletedFalse(GuaranteeStatus status, LocalDate date);
}
