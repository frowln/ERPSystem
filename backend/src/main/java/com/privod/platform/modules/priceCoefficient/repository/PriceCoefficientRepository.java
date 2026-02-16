package com.privod.platform.modules.priceCoefficient.repository;

import com.privod.platform.modules.priceCoefficient.domain.CoefficientStatus;
import com.privod.platform.modules.priceCoefficient.domain.CoefficientType;
import com.privod.platform.modules.priceCoefficient.domain.PriceCoefficient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PriceCoefficientRepository extends JpaRepository<PriceCoefficient, UUID> {

    Page<PriceCoefficient> findByDeletedFalse(Pageable pageable);

    Page<PriceCoefficient> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<PriceCoefficient> findByContractIdAndDeletedFalse(UUID contractId);

    @Query("SELECT pc FROM PriceCoefficient pc WHERE pc.projectId = :projectId " +
            "AND pc.status = 'ACTIVE' AND pc.deleted = false " +
            "AND pc.effectiveFrom <= :date AND (pc.effectiveTo IS NULL OR pc.effectiveTo >= :date)")
    List<PriceCoefficient> findActiveByProjectIdAndDate(@Param("projectId") UUID projectId,
                                                         @Param("date") LocalDate date);

    @Query("SELECT pc FROM PriceCoefficient pc WHERE pc.projectId = :projectId " +
            "AND pc.status = 'ACTIVE' AND pc.deleted = false")
    List<PriceCoefficient> findActiveByProjectId(@Param("projectId") UUID projectId);

    Page<PriceCoefficient> findByStatusAndDeletedFalse(CoefficientStatus status, Pageable pageable);

    Page<PriceCoefficient> findByTypeAndDeletedFalse(CoefficientType type, Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    boolean existsByCodeAndDeletedFalse(String code);
}
