package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.KpiSnapshot;
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
public interface KpiSnapshotRepository extends JpaRepository<KpiSnapshot, UUID> {

    Page<KpiSnapshot> findByKpiIdAndDeletedFalseOrderBySnapshotDateDesc(UUID kpiId, Pageable pageable);

    List<KpiSnapshot> findByKpiIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDateAsc(
            UUID kpiId, LocalDate startDate, LocalDate endDate);

    List<KpiSnapshot> findByKpiIdAndProjectIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDateAsc(
            UUID kpiId, UUID projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT ks FROM KpiSnapshot ks WHERE ks.kpiId = :kpiId AND ks.deleted = false " +
            "ORDER BY ks.snapshotDate DESC LIMIT 1")
    Optional<KpiSnapshot> findLatestByKpiId(@Param("kpiId") UUID kpiId);

    @Query("SELECT ks FROM KpiSnapshot ks WHERE ks.kpiId = :kpiId AND ks.projectId = :projectId " +
            "AND ks.deleted = false ORDER BY ks.snapshotDate DESC LIMIT 1")
    Optional<KpiSnapshot> findLatestByKpiIdAndProjectId(
            @Param("kpiId") UUID kpiId, @Param("projectId") UUID projectId);

    List<KpiSnapshot> findBySnapshotDateAndDeletedFalse(LocalDate snapshotDate);
}
