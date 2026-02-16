package com.privod.platform.modules.maintenance.repository;

import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import com.privod.platform.modules.maintenance.domain.MaintenanceEquipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaintenanceEquipmentRepository extends JpaRepository<MaintenanceEquipment, UUID>,
        JpaSpecificationExecutor<MaintenanceEquipment> {

    Page<MaintenanceEquipment> findByStatusAndDeletedFalse(EquipmentStatus status, Pageable pageable);

    Page<MaintenanceEquipment> findByDeletedFalse(Pageable pageable);

    @Query("SELECT e FROM MaintenanceEquipment e WHERE e.deleted = false AND " +
            "(LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MaintenanceEquipment> searchByNameOrSerial(@Param("search") String search, Pageable pageable);

    @Query("SELECT e.status, COUNT(e) FROM MaintenanceEquipment e WHERE e.deleted = false GROUP BY e.status")
    java.util.List<Object[]> countByStatus();

    @Query("SELECT COUNT(e) FROM MaintenanceEquipment e WHERE e.deleted = false " +
            "AND e.status = 'OPERATIONAL'")
    long countOperationalEquipment();

    @Query("SELECT COUNT(e) FROM MaintenanceEquipment e WHERE e.deleted = false")
    long countTotalEquipment();
}
