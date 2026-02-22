package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.ClientProgressSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientProgressSnapshotRepository extends JpaRepository<ClientProgressSnapshot, UUID> {

    Page<ClientProgressSnapshot> findByProjectIdAndPublishedTrueAndDeletedFalse(
            UUID projectId, Pageable pageable);

    Page<ClientProgressSnapshot> findByProjectIdAndDeletedFalse(
            UUID projectId, Pageable pageable);

    @Query("SELECT s FROM ClientProgressSnapshot s WHERE s.projectId = :projectId " +
            "AND s.published = true AND s.deleted = false " +
            "ORDER BY s.snapshotDate DESC LIMIT 1")
    Optional<ClientProgressSnapshot> findLatestPublishedByProjectId(
            @Param("projectId") UUID projectId);

    @Query("SELECT s FROM ClientProgressSnapshot s WHERE s.projectId = :projectId " +
            "AND s.deleted = false ORDER BY s.snapshotDate DESC LIMIT 1")
    Optional<ClientProgressSnapshot> findLatestByProjectId(
            @Param("projectId") UUID projectId);
}
