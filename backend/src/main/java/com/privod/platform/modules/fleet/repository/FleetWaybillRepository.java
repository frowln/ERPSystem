package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.FleetWaybill;
import com.privod.platform.modules.fleet.domain.WaybillStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetWaybillRepository extends JpaRepository<FleetWaybill, UUID> {

    Optional<FleetWaybill> findByIdAndDeletedFalse(UUID id);

    @Query("""
            SELECT w FROM FleetWaybill w WHERE w.organizationId = :orgId AND w.deleted = false
            AND (:vehicleId IS NULL OR w.vehicleId = :vehicleId)
            AND (:status IS NULL OR w.status = :status)
            AND (:search IS NULL OR LOWER(w.number) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(w.driverName) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY w.waybillDate DESC
            """)
    Page<FleetWaybill> findAllFiltered(
            @Param("orgId") UUID orgId,
            @Param("vehicleId") UUID vehicleId,
            @Param("status") WaybillStatus status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT w FROM FleetWaybill w WHERE w.vehicleId = :vehicleId AND w.deleted = false ORDER BY w.waybillDate DESC")
    List<FleetWaybill> findByVehicleIdAndDeletedFalse(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT COUNT(w) FROM FleetWaybill w WHERE w.organizationId = :orgId AND w.status = :status AND w.deleted = false")
    long countByOrgAndStatus(@Param("orgId") UUID orgId, @Param("status") WaybillStatus status);

    @Query("SELECT COALESCE(SUM(w.fuelConsumed), 0) FROM FleetWaybill w WHERE w.organizationId = :orgId AND w.waybillDate BETWEEN :from AND :to AND w.deleted = false")
    java.math.BigDecimal sumFuelConsumedByOrgAndDateRange(@Param("orgId") UUID orgId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = "SELECT nextval('fleet_waybill_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
