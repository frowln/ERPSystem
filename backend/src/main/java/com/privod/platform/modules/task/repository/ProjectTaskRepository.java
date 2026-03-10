package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskStatus;
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
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, UUID>, JpaSpecificationExecutor<ProjectTask> {

    Page<ProjectTask> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<ProjectTask> findByParentTaskIdAndDeletedFalseOrderBySortOrderAsc(UUID parentTaskId);

    List<ProjectTask> findByProjectIdAndDeletedFalseOrderByWbsCodeAscSortOrderAsc(UUID projectId);

    List<ProjectTask> findByProjectIdAndDeletedFalseOrderByPlannedStartDateAscSortOrderAsc(UUID projectId);

    @Query("SELECT t.status, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) GROUP BY t.status")
    List<Object[]> countByStatusAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT t.status, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId IN :projectIds GROUP BY t.status")
    List<Object[]> countByStatusAndProjectIdIn(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT t.projectId, t.status, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId IN :projectIds GROUP BY t.projectId, t.status")
    List<Object[]> countByProjectIdAndStatusGrouped(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT t.priority, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) GROUP BY t.priority")
    List<Object[]> countByPriorityAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT t.priority, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId IN :projectIds GROUP BY t.priority")
    List<Object[]> countByPriorityAndProjectIdIn(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT t.assigneeName, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "t.assigneeName IS NOT NULL AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) GROUP BY t.assigneeName")
    List<Object[]> countByAssigneeAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT t.assigneeName, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "t.assigneeName IS NOT NULL AND t.projectId IN :projectIds GROUP BY t.assigneeName")
    List<Object[]> countByAssigneeAndProjectIdIn(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT t FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) AND " +
            "t.plannedEndDate < :today AND t.status NOT IN :excludeStatuses")
    List<ProjectTask> findOverdueTasks(@Param("projectId") UUID projectId,
                                       @Param("today") LocalDate today,
                                       @Param("excludeStatuses") List<TaskStatus> excludeStatuses);

    @Query("SELECT t FROM ProjectTask t WHERE t.deleted = false AND " +
            "t.projectId IN :projectIds AND " +
            "t.plannedEndDate < :today AND t.status NOT IN :excludeStatuses")
    List<ProjectTask> findOverdueTasksByProjectIds(@Param("projectIds") List<UUID> projectIds,
                                                   @Param("today") LocalDate today,
                                                   @Param("excludeStatuses") List<TaskStatus> excludeStatuses);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId)")
    long countActiveTasks(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId IN :projectIds")
    long countActiveTasksByProjectIds(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId = :projectId")
    long countByProjectIdAndDeletedFalse(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId = :projectId AND t.status = :status")
    long countByProjectIdAndStatusAndDeletedFalse(@Param("projectId") UUID projectId, @Param("status") TaskStatus status);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.projectId = :projectId " +
            "AND t.plannedEndDate < CURRENT_DATE AND t.status NOT IN ('DONE', 'CANCELLED')")
    long countOverdueByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND t.parentTaskId = :parentTaskId")
    int countByParentTaskIdAndDeletedFalse(@Param("parentTaskId") UUID parentTaskId);

    List<ProjectTask> findByAssigneeIdAndDeletedFalseOrderByUpdatedAtDesc(UUID assigneeId);

    List<ProjectTask> findByReporterIdAndDeletedFalseAndAssigneeIdNotOrderByUpdatedAtDesc(UUID reporterId, UUID assigneeId);

    @Query(value = "SELECT nextval('task_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
