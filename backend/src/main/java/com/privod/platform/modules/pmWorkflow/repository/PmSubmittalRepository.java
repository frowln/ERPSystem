package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
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
public interface PmSubmittalRepository extends JpaRepository<Submittal, UUID>, JpaSpecificationExecutor<Submittal> {

    Page<Submittal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Submittal> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, SubmittalStatus status, Pageable pageable);

    List<Submittal> findByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, SubmittalStatus status);

    @Query("SELECT s FROM Submittal s WHERE s.ballInCourt = :userId AND s.status NOT IN ('CLOSED', 'APPROVED') AND s.deleted = false")
    List<Submittal> findByBallInCourt(@Param("userId") UUID userId);

    @Query("SELECT s FROM Submittal s WHERE s.dueDate <= :date AND s.status NOT IN ('CLOSED', 'APPROVED') AND s.deleted = false")
    List<Submittal> findOverdueSubmittals(@Param("date") LocalDate date);

    @Query("SELECT s FROM Submittal s WHERE s.projectId = :projectId AND s.dueDate <= :date AND s.status NOT IN ('CLOSED', 'APPROVED') AND s.deleted = false")
    List<Submittal> findOverdueSubmittalsByProject(@Param("projectId") UUID projectId, @Param("date") LocalDate date);

    @Query("SELECT MAX(CAST(SUBSTRING(s.code, LENGTH(:prefix) + 1) AS int)) FROM Submittal s WHERE s.projectId = :projectId AND s.code LIKE CONCAT(:prefix, '%')")
    Integer findMaxNumberByProject(@Param("projectId") UUID projectId, @Param("prefix") String prefix);
}
