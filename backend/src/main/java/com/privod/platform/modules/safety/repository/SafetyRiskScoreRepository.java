package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyRiskLevel;
import com.privod.platform.modules.safety.domain.SafetyRiskScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SafetyRiskScoreRepository extends JpaRepository<SafetyRiskScore, UUID> {

    Optional<SafetyRiskScore> findByOrganizationIdAndProjectIdAndDeletedFalseAndValidUntilIsNull(
            UUID organizationId, UUID projectId);

    Page<SafetyRiskScore> findByOrganizationIdAndDeletedFalseAndValidUntilIsNull(
            UUID organizationId, Pageable pageable);

    List<SafetyRiskScore> findByOrganizationIdAndRiskLevelAndDeletedFalseAndValidUntilIsNull(
            UUID organizationId, SafetyRiskLevel riskLevel);

    @Modifying
    @Query("UPDATE SafetyRiskScore s SET s.validUntil = :now WHERE s.organizationId = :orgId " +
            "AND s.projectId = :projectId AND s.deleted = false AND s.validUntil IS NULL")
    void invalidatePreviousScores(@Param("orgId") UUID organizationId,
                                  @Param("projectId") UUID projectId,
                                  @Param("now") Instant now);
}
