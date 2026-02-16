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

    @Query("SELECT t.priority, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) GROUP BY t.priority")
    List<Object[]> countByPriorityAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT t.assigneeName, COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "t.assigneeName IS NOT NULL AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) GROUP BY t.assigneeName")
    List<Object[]> countByAssigneeAndProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT t FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId) AND " +
            "t.plannedEndDate < :today AND t.status NOT IN :excludeStatuses")
    List<ProjectTask> findOverdueTasks(@Param("projectId") UUID projectId,
                                       @Param("today") LocalDate today,
                                       @Param("excludeStatuses") List<TaskStatus> excludeStatuses);

    @Query("SELECT COUNT(t) FROM ProjectTask t WHERE t.deleted = false AND " +
            "(:projectId IS NULL OR t.projectId = :projectId)")
    long countActiveTasks(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('task_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
