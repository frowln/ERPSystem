package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.domain.EmploymentContract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmploymentContractRepository extends JpaRepository<EmploymentContract, UUID> {

    List<EmploymentContract> findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(UUID employeeId);

    Optional<EmploymentContract> findByEmployeeIdAndStatusAndDeletedFalse(UUID employeeId, ContractStatus status);

    Page<EmploymentContract> findByStatusAndDeletedFalse(ContractStatus status, Pageable pageable);

    Optional<EmploymentContract> findByContractNumberAndDeletedFalse(String contractNumber);

    List<EmploymentContract> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
