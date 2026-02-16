package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.WbsDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WbsDependencyRepository extends JpaRepository<WbsDependency, UUID> {

    List<WbsDependency> findByPredecessorIdAndDeletedFalse(UUID predecessorId);

    List<WbsDependency> findBySuccessorIdAndDeletedFalse(UUID successorId);

    @Query("SELECT d FROM WbsDependency d WHERE (d.predecessorId = :nodeId OR d.successorId = :nodeId) AND d.deleted = false")
    List<WbsDependency> findByNodeId(@Param("nodeId") UUID nodeId);

    @Query("SELECT d FROM WbsDependency d WHERE d.predecessorId IN " +
            "(SELECT w.id FROM WbsNode w WHERE w.projectId = :projectId AND w.deleted = false) AND d.deleted = false")
    List<WbsDependency> findByProjectId(@Param("projectId") UUID projectId);
}
