package com.privod.platform.modules.revenueRecognition.repository;

import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevenueRecognitionPeriodRepository extends JpaRepository<RevenueRecognitionPeriod, UUID> {

    Page<RevenueRecognitionPeriod> findByRevenueContractIdAndDeletedFalseOrderByPeriodStartDesc(
            UUID revenueContractId, Pageable pageable);

    List<RevenueRecognitionPeriod> findByRevenueContractIdAndDeletedFalseOrderByPeriodStartAsc(
            UUID revenueContractId);

    Optional<RevenueRecognitionPeriod> findByRevenueContractIdAndPeriodStartAndPeriodEndAndDeletedFalse(
            UUID revenueContractId, LocalDate periodStart, LocalDate periodEnd);

    @Query("SELECT rrp FROM RevenueRecognitionPeriod rrp " +
            "WHERE rrp.revenueContractId = :contractId AND rrp.deleted = false " +
            "AND rrp.periodEnd < :periodStart " +
            "ORDER BY rrp.periodEnd DESC LIMIT 1")
    Optional<RevenueRecognitionPeriod> findPreviousPeriod(@Param("contractId") UUID contractId,
                                                           @Param("periodStart") LocalDate periodStart);

    List<RevenueRecognitionPeriod> findByRevenueContractIdAndStatusAndDeletedFalse(
            UUID revenueContractId, PeriodStatus status);

    @Query("SELECT COUNT(rrp) FROM RevenueRecognitionPeriod rrp " +
            "WHERE rrp.revenueContractId = :contractId AND rrp.status = :status AND rrp.deleted = false")
    long countByContractAndStatus(@Param("contractId") UUID contractId,
                                   @Param("status") PeriodStatus status);
}
