package com.privod.platform.modules.maintenance.repository;

import com.privod.platform.modules.maintenance.domain.MaintenanceRequest;
import com.privod.platform.modules.maintenance.domain.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, UUID>,
        JpaSpecificationExecutor<MaintenanceRequest> {

    Page<MaintenanceRequest> findByStatusAndDeletedFalse(RequestStatus status, Pageable pageable);

    Page<MaintenanceRequest> findByEquipmentIdAndDeletedFalse(UUID equipmentId, Pageable pageable);

    Page<MaintenanceRequest> findByMaintenanceTeamIdAndDeletedFalse(UUID teamId, Pageable pageable);

    @Query("SELECT r FROM MaintenanceRequest r WHERE r.deleted = false AND " +
            "(LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(r.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MaintenanceRequest> searchByName(@Param("search") String search, Pageable pageable);

    @Query("SELECT r FROM MaintenanceRequest r WHERE r.deleted = false " +
            "AND r.status IN ('NEW', 'IN_PROGRESS') " +
            "AND r.scheduledDate < :today")
    List<MaintenanceRequest> findOverdueRequests(@Param("today") LocalDate today);

    @Query("SELECT r.status, COUNT(r) FROM MaintenanceRequest r WHERE r.deleted = false GROUP BY r.status")
    List<Object[]> countByStatus();

    @Query("SELECT COUNT(r) FROM MaintenanceRequest r WHERE r.deleted = false " +
            "AND r.status IN ('NEW', 'IN_PROGRESS')")
    long countOpenRequests();

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (completed_date - request_date)) / 86400.0) " +
            "FROM maintenance_requests WHERE deleted = false AND completed_date IS NOT NULL",
            nativeQuery = true)
    Double avgResolutionDays();
}
