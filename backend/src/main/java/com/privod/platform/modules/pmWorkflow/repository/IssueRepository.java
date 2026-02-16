package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.Issue;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
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
public interface IssueRepository extends JpaRepository<Issue, UUID>, JpaSpecificationExecutor<Issue> {

    Page<Issue> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Issue> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, IssueStatus status, Pageable pageable);

    List<Issue> findByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, IssueStatus status);

    @Query("SELECT i FROM Issue i WHERE i.assignedToId = :userId AND i.status IN ('OPEN', 'IN_PROGRESS', 'REOPENED') AND i.deleted = false")
    List<Issue> findOpenIssuesByAssignee(@Param("userId") UUID userId);

    @Query("SELECT i FROM Issue i WHERE i.dueDate <= :date AND i.status NOT IN ('CLOSED', 'RESOLVED') AND i.deleted = false")
    List<Issue> findOverdueIssues(@Param("date") LocalDate date);

    @Query("SELECT i FROM Issue i WHERE i.projectId = :projectId AND i.dueDate <= :date AND i.status NOT IN ('CLOSED', 'RESOLVED') AND i.deleted = false")
    List<Issue> findOverdueIssuesByProject(@Param("projectId") UUID projectId, @Param("date") LocalDate date);

    @Query("SELECT MAX(CAST(SUBSTRING(i.number, LENGTH(:prefix) + 1) AS int)) FROM Issue i WHERE i.projectId = :projectId AND i.number LIKE CONCAT(:prefix, '%')")
    Integer findMaxNumberByProject(@Param("projectId") UUID projectId, @Param("prefix") String prefix);
}
