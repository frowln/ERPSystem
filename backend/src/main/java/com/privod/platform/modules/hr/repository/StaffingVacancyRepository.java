package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.StaffingVacancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StaffingVacancyRepository extends JpaRepository<StaffingVacancy, UUID> {

    List<StaffingVacancy> findByStaffingPositionIdAndDeletedFalse(UUID staffingPositionId);

    List<StaffingVacancy> findByStaffingPositionIdInAndDeletedFalse(List<UUID> staffingPositionIds);
}
