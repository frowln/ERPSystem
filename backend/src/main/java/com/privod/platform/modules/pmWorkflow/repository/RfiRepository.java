package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.Rfi;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RfiRepository extends JpaRepository<Rfi, UUID>, JpaSpecificationExecutor<Rfi> {

    Page<Rfi> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Rfi> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, RfiStatus status, Pageable pageable);

    List<Rfi> findByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, RfiStatus status);

    @Query("SELECT r FROM Rfi r WHERE r.assignedToId = :userId AND r.status IN ('OPEN', 'ASSIGNED') AND r.deleted = false")
    List<Rfi> findOpenRfisByAssignee(@Param("userId") UUID userId);

    @Query("SELECT r FROM Rfi r WHERE r.dueDate <= :date AND r.status NOT IN ('CLOSED', 'VOID') AND r.deleted = false")
    List<Rfi> findOverdueRfis(@Param("date") LocalDate date);

    @Query("SELECT r FROM Rfi r WHERE r.projectId = :projectId AND r.dueDate <= :date AND r.status NOT IN ('CLOSED', 'VOID') AND r.deleted = false")
    List<Rfi> findOverdueRfisByProject(@Param("projectId") UUID projectId, @Param("date") LocalDate date);

    @Query("SELECT MAX(CAST(SUBSTRING(r.number, LENGTH(:prefix) + 1) AS int)) FROM Rfi r WHERE r.projectId = :projectId AND r.number LIKE CONCAT(:prefix, '%')")
    Integer findMaxNumberByProject(@Param("projectId") UUID projectId, @Param("prefix") String prefix);
}
