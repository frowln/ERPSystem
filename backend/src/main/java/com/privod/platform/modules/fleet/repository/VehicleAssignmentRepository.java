package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.AssignmentStatus;
import com.privod.platform.modules.fleet.domain.VehicleAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleAssignmentRepository extends JpaRepository<VehicleAssignment, UUID> {

    Page<VehicleAssignment> findByVehicleIdAndDeletedFalse(UUID vehicleId, Pageable pageable);

    Page<VehicleAssignment> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<VehicleAssignment> findByVehicleIdAndStatusAndDeletedFalse(UUID vehicleId, AssignmentStatus status);

    Optional<VehicleAssignment> findByVehicleIdAndStatusInAndDeletedFalse(
            UUID vehicleId, List<AssignmentStatus> statuses);

    @Query("SELECT a FROM VehicleAssignment a WHERE a.vehicleId = :vehicleId " +
            "AND a.status = 'ACTIVE' AND a.deleted = false")
    Optional<VehicleAssignment> findActiveAssignment(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT a FROM VehicleAssignment a WHERE a.projectId = :projectId " +
            "AND a.status = 'ACTIVE' AND a.deleted = false")
    List<VehicleAssignment> findActiveAssignmentsByProject(@Param("projectId") UUID projectId);
}
