package com.privod.platform.modules.monteCarlo.repository;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloEacResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonteCarloEacResultRepository extends JpaRepository<MonteCarloEacResult, UUID> {

    List<MonteCarloEacResult> findByOrganizationIdAndSimulationIdAndDeletedFalse(
            UUID organizationId, UUID simulationId);

    @Query("SELECT r FROM MonteCarloEacResult r " +
            "WHERE r.projectId = :projectId AND r.deleted = false " +
            "ORDER BY r.calculatedAt DESC LIMIT 1")
    Optional<MonteCarloEacResult> findLatestByProjectId(@Param("projectId") UUID projectId);

    Page<MonteCarloEacResult> findByOrganizationIdAndProjectIdAndDeletedFalseOrderByCalculatedAtDesc(
            UUID organizationId, UUID projectId, Pageable pageable);
}
