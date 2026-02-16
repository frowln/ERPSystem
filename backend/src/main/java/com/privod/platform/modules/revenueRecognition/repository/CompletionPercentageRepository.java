package com.privod.platform.modules.revenueRecognition.repository;

import com.privod.platform.modules.revenueRecognition.domain.CompletionPercentage;
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
public interface CompletionPercentageRepository extends JpaRepository<CompletionPercentage, UUID> {

    Page<CompletionPercentage> findByRevenueContractIdAndDeletedFalseOrderByCalculationDateDesc(
            UUID revenueContractId, Pageable pageable);

    List<CompletionPercentage> findByRevenueContractIdAndDeletedFalseOrderByCalculationDateAsc(
            UUID revenueContractId);

    @Query("SELECT cp FROM CompletionPercentage cp WHERE cp.revenueContractId = :contractId " +
            "AND cp.deleted = false ORDER BY cp.calculationDate DESC LIMIT 1")
    Optional<CompletionPercentage> findLatestByContract(@Param("contractId") UUID contractId);

    Optional<CompletionPercentage> findByRevenueContractIdAndCalculationDateAndDeletedFalse(
            UUID revenueContractId, LocalDate calculationDate);
}
