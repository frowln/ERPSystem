package com.privod.platform.modules.payroll.repository;

import com.privod.platform.modules.payroll.domain.PayrollTemplate;
import com.privod.platform.modules.payroll.domain.PayrollType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayrollTemplateRepository extends JpaRepository<PayrollTemplate, UUID> {

    Page<PayrollTemplate> findByDeletedFalse(Pageable pageable);

    Page<PayrollTemplate> findByIsActiveAndDeletedFalse(boolean isActive, Pageable pageable);

    Page<PayrollTemplate> findByTypeAndDeletedFalse(PayrollType type, Pageable pageable);

    List<PayrollTemplate> findByProjectIdAndIsActiveAndDeletedFalse(UUID projectId, boolean isActive);

    boolean existsByCodeAndDeletedFalse(String code);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
