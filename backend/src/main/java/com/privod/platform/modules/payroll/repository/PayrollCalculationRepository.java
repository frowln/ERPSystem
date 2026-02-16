package com.privod.platform.modules.payroll.repository;

import com.privod.platform.modules.payroll.domain.PayrollCalculation;
import com.privod.platform.modules.payroll.domain.PayrollCalculationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayrollCalculationRepository extends JpaRepository<PayrollCalculation, UUID> {

    Page<PayrollCalculation> findByDeletedFalse(Pageable pageable);

    Page<PayrollCalculation> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    Page<PayrollCalculation> findByStatusAndDeletedFalse(PayrollCalculationStatus status, Pageable pageable);

    List<PayrollCalculation> findByTemplateIdAndDeletedFalse(UUID templateId);

    @Query("SELECT pc FROM PayrollCalculation pc WHERE pc.deleted = false " +
            "AND pc.periodStart >= :periodStart AND pc.periodEnd <= :periodEnd")
    List<PayrollCalculation> findByPeriod(@Param("periodStart") LocalDate periodStart,
                                           @Param("periodEnd") LocalDate periodEnd);

    @Query("SELECT COALESCE(SUM(pc.netPay), 0) FROM PayrollCalculation pc " +
            "WHERE pc.deleted = false AND pc.status = 'APPROVED' " +
            "AND pc.periodStart >= :periodStart AND pc.periodEnd <= :periodEnd")
    BigDecimal sumNetPayByPeriod(@Param("periodStart") LocalDate periodStart,
                                  @Param("periodEnd") LocalDate periodEnd);

    long countByStatusAndDeletedFalse(PayrollCalculationStatus status);
}
