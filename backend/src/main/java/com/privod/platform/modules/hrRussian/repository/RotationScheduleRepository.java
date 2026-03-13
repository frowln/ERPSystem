package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.RotationSchedule;
import com.privod.platform.modules.hrRussian.domain.RotationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RotationScheduleRepository extends JpaRepository<RotationSchedule, UUID> {

    Optional<RotationSchedule> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<RotationSchedule> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<RotationSchedule> findByOrganizationIdAndEmployeeIdAndDeletedFalse(UUID organizationId, UUID employeeId, Pageable pageable);

    Page<RotationSchedule> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, RotationStatus status, Pageable pageable);

    List<RotationSchedule> findByOrganizationIdAndStatusAndShiftStartBetweenAndDeletedFalse(
            UUID organizationId, RotationStatus status, LocalDate from, LocalDate to);
}
