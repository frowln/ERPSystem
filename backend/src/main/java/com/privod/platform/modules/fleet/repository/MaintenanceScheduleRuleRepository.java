package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.MaintenanceScheduleRule;
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
public interface MaintenanceScheduleRuleRepository extends JpaRepository<MaintenanceScheduleRule, UUID> {

    Optional<MaintenanceScheduleRule> findByIdAndDeletedFalse(UUID id);

    Page<MaintenanceScheduleRule> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<MaintenanceScheduleRule> findByOrganizationIdAndVehicleIdAndDeletedFalse(
            UUID organizationId, UUID vehicleId, Pageable pageable);

    @Query("SELECT r FROM MaintenanceScheduleRule r WHERE r.organizationId = :orgId " +
            "AND r.deleted = false AND r.isActive = true " +
            "AND (r.vehicleId = :vehicleId OR r.appliesToAllVehicles = true)")
    List<MaintenanceScheduleRule> findActiveRulesForVehicle(
            @Param("orgId") UUID organizationId,
            @Param("vehicleId") UUID vehicleId);

    @Query("SELECT r FROM MaintenanceScheduleRule r WHERE r.organizationId = :orgId " +
            "AND r.deleted = false AND r.isActive = true")
    List<MaintenanceScheduleRule> findAllActiveRules(@Param("orgId") UUID organizationId);
}
