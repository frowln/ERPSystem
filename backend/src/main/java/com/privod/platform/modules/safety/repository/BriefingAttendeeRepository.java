package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.BriefingAttendee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BriefingAttendeeRepository extends JpaRepository<BriefingAttendee, UUID> {

    List<BriefingAttendee> findByBriefingIdAndDeletedFalse(UUID briefingId);

    List<BriefingAttendee> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
