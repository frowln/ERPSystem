package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, UUID> {
    List<TaskLabel> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    List<TaskLabel> findByOrganizationIdIsNullOrderByNameAsc();
    boolean existsByNameAndOrganizationId(String name, UUID organizationId);
}
