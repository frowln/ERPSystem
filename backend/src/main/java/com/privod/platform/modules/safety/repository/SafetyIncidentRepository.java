package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SafetyIncidentRepository extends JpaRepository<SafetyIncident, UUID>,
        JpaSpecificationExecutor<SafetyIncident> {

    Page<SafetyIncident> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("SELECT si.severity, COUNT(si) FROM SafetyIncident si " +
            "WHERE si.deleted = false AND (:projectId IS NULL OR si.projectId = :projectId) " +
            "GROUP BY si.severity")
    List<Object[]> countBySeverity(@Param("projectId") UUID projectId);

    @Query("SELECT si.incidentType, COUNT(si) FROM SafetyIncident si " +
            "WHERE si.deleted = false AND (:projectId IS NULL OR si.projectId = :projectId) " +
            "GROUP BY si.incidentType")
    List<Object[]> countByType(@Param("projectId") UUID projectId);

    @Query("SELECT si.status, COUNT(si) FROM SafetyIncident si " +
            "WHERE si.deleted = false AND (:projectId IS NULL OR si.projectId = :projectId) " +
            "GROUP BY si.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(si) FROM SafetyIncident si " +
            "WHERE si.deleted = false AND (:projectId IS NULL OR si.projectId = :projectId)")
    long countTotal(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(si.workDaysLost), 0) FROM SafetyIncident si " +
            "WHERE si.deleted = false AND (:projectId IS NULL OR si.projectId = :projectId)")
    int sumWorkDaysLost(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('incident_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
