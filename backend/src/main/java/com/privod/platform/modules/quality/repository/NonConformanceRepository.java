package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.NonConformance;
import com.privod.platform.modules.quality.domain.NonConformanceStatus;
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
public interface NonConformanceRepository extends JpaRepository<NonConformance, UUID>,
        JpaSpecificationExecutor<NonConformance> {

    Page<NonConformance> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<NonConformance> findByDeletedFalse(Pageable pageable);

    List<NonConformance> findByQualityCheckIdAndDeletedFalse(UUID qualityCheckId);

    Page<NonConformance> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, NonConformanceStatus status, Pageable pageable);

    @Query("SELECT nc.severity, COUNT(nc) FROM NonConformance nc " +
            "WHERE nc.deleted = false AND (:projectId IS NULL OR nc.projectId = :projectId) " +
            "GROUP BY nc.severity")
    List<Object[]> countBySeverity(@Param("projectId") UUID projectId);

    @Query("SELECT nc.status, COUNT(nc) FROM NonConformance nc " +
            "WHERE nc.deleted = false AND (:projectId IS NULL OR nc.projectId = :projectId) " +
            "GROUP BY nc.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('non_conformance_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
