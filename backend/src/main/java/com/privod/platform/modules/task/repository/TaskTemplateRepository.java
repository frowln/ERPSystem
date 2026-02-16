package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, UUID> {

    Page<TaskTemplate> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    List<TaskTemplate> findByDeletedFalseAndIsActiveTrue();

    List<TaskTemplate> findByCategoryAndDeletedFalseAndIsActiveTrue(String category);

    Page<TaskTemplate> findByDeletedFalse(Pageable pageable);
}
