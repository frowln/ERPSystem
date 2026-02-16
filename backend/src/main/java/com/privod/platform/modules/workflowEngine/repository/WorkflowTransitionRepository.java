package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.WorkflowTransition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {

    Page<WorkflowTransition> findByEntityIdAndEntityTypeAndDeletedFalse(
            UUID entityId, String entityType, Pageable pageable);

    List<WorkflowTransition> findByEntityIdAndEntityTypeAndDeletedFalseOrderByTransitionedAtDesc(
            UUID entityId, String entityType);

    @Query("SELECT t FROM WorkflowTransition t WHERE t.entityId = :entityId AND t.entityType = :entityType " +
            "AND t.deleted = false ORDER BY t.transitionedAt DESC LIMIT 1")
    Optional<WorkflowTransition> findLatestByEntityIdAndEntityType(
            @Param("entityId") UUID entityId, @Param("entityType") String entityType);
}
