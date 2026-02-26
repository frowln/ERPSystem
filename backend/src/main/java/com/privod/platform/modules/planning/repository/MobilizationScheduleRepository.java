package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.MobilizationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MobilizationScheduleRepository extends JpaRepository<MobilizationSchedule, UUID> {

    List<MobilizationSchedule> findByProjectIdAndOrganizationIdOrderByCreatedAtDesc(UUID projectId, UUID organizationId);

    List<MobilizationSchedule> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
