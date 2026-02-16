package com.privod.platform.modules.integration.govregistries.repository;

import com.privod.platform.modules.integration.govregistries.domain.CheckStatus;
import com.privod.platform.modules.integration.govregistries.domain.RegistryCheckResult;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;
import com.privod.platform.modules.integration.govregistries.domain.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RegistryCheckResultRepository extends JpaRepository<RegistryCheckResult, UUID> {

    Page<RegistryCheckResult> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId, Pageable pageable);

    List<RegistryCheckResult> findByInnAndDeletedFalseOrderByCheckDateDesc(String inn);

    List<RegistryCheckResult> findByInnAndRegistryTypeAndDeletedFalseOrderByCheckDateDesc(
            String inn, RegistryType registryType);

    Page<RegistryCheckResult> findByStatusAndDeletedFalse(CheckStatus status, Pageable pageable);

    Page<RegistryCheckResult> findByRiskLevelAndDeletedFalse(RiskLevel riskLevel, Pageable pageable);

    @Query("SELECT r FROM RegistryCheckResult r WHERE r.deleted = false " +
            "AND r.counterpartyId IS NOT NULL " +
            "AND r.checkDate < :before " +
            "GROUP BY r.counterpartyId, r.registryType " +
            "HAVING r.checkDate = MAX(r.checkDate)")
    List<RegistryCheckResult> findStaleChecks(@Param("before") Instant before);

    @Query("SELECT DISTINCT r.counterpartyId FROM RegistryCheckResult r " +
            "WHERE r.deleted = false AND r.counterpartyId IS NOT NULL " +
            "AND r.checkDate < :before")
    List<UUID> findCounterpartiesNeedingRecheck(@Param("before") Instant before);
}
