package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, UUID> {
    List<ProjectMilestone> findByProjectIdAndDeletedFalseOrderBySequenceAsc(UUID projectId);
}
