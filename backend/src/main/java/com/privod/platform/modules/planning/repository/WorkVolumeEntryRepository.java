package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.WorkVolumeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkVolumeEntryRepository extends JpaRepository<WorkVolumeEntry, UUID> {

    Page<WorkVolumeEntry> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<WorkVolumeEntry> findByWbsNodeIdAndDeletedFalse(UUID wbsNodeId, Pageable pageable);

    List<WorkVolumeEntry> findByProjectIdAndRecordDateAndDeletedFalse(UUID projectId, LocalDate recordDate);

    Optional<WorkVolumeEntry> findByWbsNodeIdAndRecordDateAndDeletedFalse(UUID wbsNodeId, LocalDate recordDate);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM WorkVolumeEntry e " +
            "WHERE e.wbsNodeId = :wbsNodeId AND e.deleted = false")
    BigDecimal sumQuantityByWbsNodeId(@Param("wbsNodeId") UUID wbsNodeId);

    @Query("SELECT e.wbsNodeId, COALESCE(SUM(e.quantity), 0) FROM WorkVolumeEntry e " +
            "WHERE e.projectId = :projectId AND e.deleted = false GROUP BY e.wbsNodeId")
    List<Object[]> sumQuantityGroupedByProject(@Param("projectId") UUID projectId);

    @Query("SELECT e FROM WorkVolumeEntry e " +
            "WHERE e.projectId = :projectId AND e.recordDate BETWEEN :from AND :to AND e.deleted = false " +
            "ORDER BY e.recordDate, e.wbsNodeId")
    List<WorkVolumeEntry> findByProjectIdAndDateRange(
            @Param("projectId") UUID projectId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
