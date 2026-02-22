package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.ClientMilestone;
import com.privod.platform.modules.portal.domain.MilestoneStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClientMilestoneRepository extends JpaRepository<ClientMilestone, UUID> {

    Page<ClientMilestone> findByProjectIdAndVisibleToClientTrueAndDeletedFalse(
            UUID projectId, Pageable pageable);

    Page<ClientMilestone> findByProjectIdAndDeletedFalse(
            UUID projectId, Pageable pageable);

    List<ClientMilestone> findByProjectIdAndVisibleToClientTrueAndDeletedFalseOrderBySortOrderAsc(
            UUID projectId);

    @Query("SELECT m FROM ClientMilestone m WHERE m.projectId = :projectId " +
            "AND m.deleted = false AND m.visibleToClient = true " +
            "AND m.targetDate < :today AND m.status <> 'COMPLETED'")
    List<ClientMilestone> findOverdueByProjectId(
            @Param("projectId") UUID projectId,
            @Param("today") LocalDate today);

    @Query("SELECT m FROM ClientMilestone m WHERE m.organizationId = :orgId " +
            "AND m.deleted = false AND m.targetDate < :today AND m.status <> 'COMPLETED'")
    List<ClientMilestone> findAllOverdue(
            @Param("orgId") UUID orgId,
            @Param("today") LocalDate today);
}
