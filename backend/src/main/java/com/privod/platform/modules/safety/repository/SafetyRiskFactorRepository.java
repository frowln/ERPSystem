package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyRiskFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SafetyRiskFactorRepository extends JpaRepository<SafetyRiskFactor, UUID> {

    List<SafetyRiskFactor> findByOrganizationIdAndProjectIdAndDeletedFalseOrderByWeightDesc(
            UUID organizationId, UUID projectId);

    @Modifying
    @Query("UPDATE SafetyRiskFactor f SET f.deleted = true WHERE f.organizationId = :orgId " +
            "AND f.projectId = :projectId AND f.deleted = false")
    void softDeleteByOrganizationIdAndProjectId(@Param("orgId") UUID organizationId,
                                                @Param("projectId") UUID projectId);
}
