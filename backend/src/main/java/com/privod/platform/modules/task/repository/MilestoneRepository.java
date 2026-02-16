package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    Page<Milestone> findByDeletedFalse(Pageable pageable);

    List<Milestone> findByProjectIdAndDeletedFalseOrderByDueDateAsc(UUID projectId);
}
