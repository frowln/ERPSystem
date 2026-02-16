package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.EvmSnapshot;
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
public interface EvmSnapshotRepository extends JpaRepository<EvmSnapshot, UUID> {

    Page<EvmSnapshot> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<EvmSnapshot> findByDeletedFalse(Pageable pageable);

    List<EvmSnapshot> findByProjectIdAndDeletedFalseOrderBySnapshotDateDesc(UUID projectId);

    @Query("SELECT e FROM EvmSnapshot e WHERE e.projectId = :projectId AND e.deleted = false ORDER BY e.snapshotDate DESC LIMIT 1")
    Optional<EvmSnapshot> findLatestByProjectId(@Param("projectId") UUID projectId);

    List<EvmSnapshot> findByProjectIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDate(
            UUID projectId, LocalDate from, LocalDate to);
}
