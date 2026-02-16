package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.ProjectUpdate;
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
public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, UUID> {

    Page<ProjectUpdate> findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    List<ProjectUpdate> findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId);

    @Query("SELECT u FROM ProjectUpdate u WHERE u.projectId = :projectId AND u.deleted = false " +
            "ORDER BY u.createdAt DESC LIMIT 1")
    Optional<ProjectUpdate> findLatestByProjectId(@Param("projectId") UUID projectId);
}
