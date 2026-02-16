package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTagRepository extends JpaRepository<TaskTag, UUID> {

    List<TaskTag> findByProjectIdAndDeletedFalseOrderByNameAsc(UUID projectId);

    @Query("SELECT t FROM TaskTag t WHERE t.deleted = false AND " +
            "(t.projectId IS NULL OR t.projectId = :projectId) ORDER BY t.name")
    List<TaskTag> findAvailableTagsForProject(@Param("projectId") UUID projectId);

    List<TaskTag> findByProjectIdIsNullAndDeletedFalseOrderByNameAsc();

    boolean existsByNameAndProjectIdAndDeletedFalse(String name, UUID projectId);
}
