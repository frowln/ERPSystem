package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.PredictionModelType;
import com.privod.platform.modules.analytics.domain.ProjectRiskPrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRiskPredictionRepository extends JpaRepository<ProjectRiskPrediction, UUID> {

    Page<ProjectRiskPrediction> findByOrganizationIdAndDeletedFalseOrderByPredictedAtDesc(
            UUID organizationId, Pageable pageable);

    Page<ProjectRiskPrediction> findByProjectIdAndOrganizationIdAndDeletedFalseOrderByPredictedAtDesc(
            UUID projectId, UUID organizationId, Pageable pageable);

    List<ProjectRiskPrediction> findByProjectIdAndPredictionTypeAndDeletedFalseOrderByPredictedAtDesc(
            UUID projectId, PredictionModelType predictionType);

    @Query("SELECT p FROM ProjectRiskPrediction p WHERE p.projectId = :projectId " +
            "AND p.predictionType = :type AND p.deleted = false " +
            "ORDER BY p.predictedAt DESC LIMIT 1")
    Optional<ProjectRiskPrediction> findLatestByProjectIdAndType(
            @Param("projectId") UUID projectId,
            @Param("type") PredictionModelType type);

    @Query("SELECT p FROM ProjectRiskPrediction p WHERE p.organizationId = :orgId " +
            "AND p.alertGenerated = true AND p.deleted = false " +
            "AND p.validUntil > :now ORDER BY p.probabilityPercent DESC")
    List<ProjectRiskPrediction> findActiveAlerts(
            @Param("orgId") UUID orgId,
            @Param("now") Instant now);

    @Query("SELECT p FROM ProjectRiskPrediction p WHERE p.organizationId = :orgId " +
            "AND p.probabilityPercent >= :threshold AND p.deleted = false " +
            "AND p.validUntil > :now ORDER BY p.probabilityPercent DESC")
    List<ProjectRiskPrediction> findHighRiskPredictions(
            @Param("orgId") UUID orgId,
            @Param("threshold") BigDecimal threshold,
            @Param("now") Instant now);

    @Query("SELECT DISTINCT p.projectId FROM ProjectRiskPrediction p " +
            "WHERE p.organizationId = :orgId AND p.deleted = false " +
            "AND p.validUntil > :now")
    List<UUID> findProjectIdsWithActivePredictions(
            @Param("orgId") UUID orgId,
            @Param("now") Instant now);

    long countByProjectIdAndAlertGeneratedTrueAndDeletedFalse(UUID projectId);
}
