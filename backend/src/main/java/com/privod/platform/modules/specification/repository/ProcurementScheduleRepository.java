package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.ProcurementSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcurementScheduleRepository extends JpaRepository<ProcurementSchedule, UUID> {

    List<ProcurementSchedule> findByProjectIdOrderByRequiredByDateAsc(UUID projectId);

    List<ProcurementSchedule> findByProjectIdAndOrganizationIdOrderByRequiredByDateAsc(UUID projectId, UUID organizationId);

    long countByProjectId(UUID projectId);
}
