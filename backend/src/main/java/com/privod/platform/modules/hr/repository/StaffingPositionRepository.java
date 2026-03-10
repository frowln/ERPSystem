package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.StaffingPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StaffingPositionRepository extends JpaRepository<StaffingPosition, UUID> {

    List<StaffingPosition> findByOrganizationIdAndDeletedFalseOrderByDepartmentAscPositionAsc(UUID organizationId);

    List<StaffingPosition> findByOrganizationIdAndDepartmentAndDeletedFalseOrderByPositionAsc(UUID organizationId, String department);
}
