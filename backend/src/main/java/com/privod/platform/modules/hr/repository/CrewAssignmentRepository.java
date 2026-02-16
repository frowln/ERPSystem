package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.CrewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrewAssignmentRepository extends JpaRepository<CrewAssignment, UUID> {

    List<CrewAssignment> findByProjectIdAndActiveTrue(UUID projectId);

    List<CrewAssignment> findByEmployeeIdAndActiveTrue(UUID employeeId);

    Optional<CrewAssignment> findByEmployeeIdAndProjectIdAndActiveTrue(UUID employeeId, UUID projectId);

    List<CrewAssignment> findByProjectIdAndDeletedFalse(UUID projectId);

    List<CrewAssignment> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
