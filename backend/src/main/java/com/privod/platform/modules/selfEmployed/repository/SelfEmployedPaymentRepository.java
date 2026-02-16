package com.privod.platform.modules.selfEmployed.repository;

import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPayment;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPaymentStatus;
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
public interface SelfEmployedPaymentRepository extends JpaRepository<SelfEmployedPayment, UUID> {

    Page<SelfEmployedPayment> findByDeletedFalse(Pageable pageable);

    Page<SelfEmployedPayment> findByContractorIdAndDeletedFalse(UUID contractorId, Pageable pageable);

    Page<SelfEmployedPayment> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<SelfEmployedPayment> findByStatusAndDeletedFalse(SelfEmployedPaymentStatus status, Pageable pageable);

    @Query("SELECT p FROM SelfEmployedPayment p WHERE p.projectId = :projectId " +
            "AND p.serviceDate >= :periodStart AND p.serviceDate <= :periodEnd " +
            "AND p.deleted = false AND p.status <> 'CANCELLED'")
    List<SelfEmployedPayment> findByProjectIdAndPeriod(@Param("projectId") UUID projectId,
                                                        @Param("periodStart") LocalDate periodStart,
                                                        @Param("periodEnd") LocalDate periodEnd);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM SelfEmployedPayment p " +
            "WHERE p.projectId = :projectId AND p.deleted = false " +
            "AND p.serviceDate >= :periodStart AND p.serviceDate <= :periodEnd " +
            "AND p.status <> 'CANCELLED'")
    BigDecimal sumAmountByProjectIdAndPeriod(@Param("projectId") UUID projectId,
                                              @Param("periodStart") LocalDate periodStart,
                                              @Param("periodEnd") LocalDate periodEnd);

    @Query("SELECT COUNT(p) FROM SelfEmployedPayment p " +
            "WHERE p.projectId = :projectId AND p.deleted = false " +
            "AND p.serviceDate >= :periodStart AND p.serviceDate <= :periodEnd " +
            "AND p.status <> 'CANCELLED'")
    int countByProjectIdAndPeriod(@Param("projectId") UUID projectId,
                                   @Param("periodStart") LocalDate periodStart,
                                   @Param("periodEnd") LocalDate periodEnd);

    long countByContractorIdAndDeletedFalse(UUID contractorId);
}
