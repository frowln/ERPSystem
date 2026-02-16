package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Vehicle> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<Vehicle> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, VehicleStatus status, Pageable pageable);

    Page<Vehicle> findByOrganizationIdAndVehicleTypeAndDeletedFalse(UUID organizationId, VehicleType vehicleType, Pageable pageable);

    List<Vehicle> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, VehicleStatus status);

    List<Vehicle> findByOrganizationIdAndCurrentProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    List<Vehicle> findByOrganizationIdAndCurrentProjectIdInAndDeletedFalse(UUID organizationId, List<UUID> projectIds);

    @Query("SELECT v.id FROM Vehicle v WHERE v.deleted = false AND v.organizationId = :organizationId")
    List<UUID> findAllIdsByOrganizationIdAndDeletedFalse(@Param("organizationId") UUID organizationId);

    Page<Vehicle> findByDeletedFalse(Pageable pageable);

    Page<Vehicle> findByStatusAndDeletedFalse(VehicleStatus status, Pageable pageable);

    Page<Vehicle> findByVehicleTypeAndDeletedFalse(VehicleType vehicleType, Pageable pageable);

    List<Vehicle> findByStatusAndDeletedFalse(VehicleStatus status);

    List<Vehicle> findByCurrentProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND v.status = 'AVAILABLE'")
    List<Vehicle> findAvailableVehicles();

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND v.organizationId = :organizationId AND v.status = 'AVAILABLE'")
    List<Vehicle> findAvailableVehiclesByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false " +
            "AND v.insuranceExpiryDate IS NOT NULL " +
            "AND v.insuranceExpiryDate <= :threshold")
    List<Vehicle> findByInsuranceExpiringBefore(@Param("threshold") LocalDate threshold);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND v.organizationId = :organizationId " +
            "AND v.insuranceExpiryDate IS NOT NULL AND v.insuranceExpiryDate <= :threshold")
    List<Vehicle> findByInsuranceExpiringBeforeAndOrganizationId(@Param("threshold") LocalDate threshold,
                                                                 @Param("organizationId") UUID organizationId);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false " +
            "AND v.techInspectionExpiryDate IS NOT NULL " +
            "AND v.techInspectionExpiryDate <= :threshold")
    List<Vehicle> findByTechInspectionExpiringBefore(@Param("threshold") LocalDate threshold);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND v.organizationId = :organizationId " +
            "AND v.techInspectionExpiryDate IS NOT NULL AND v.techInspectionExpiryDate <= :threshold")
    List<Vehicle> findByTechInspectionExpiringBeforeAndOrganizationId(@Param("threshold") LocalDate threshold,
                                                                      @Param("organizationId") UUID organizationId);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND " +
            "(LOWER(v.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.make) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.model) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.vin) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Vehicle> searchVehicles(@Param("search") String search, Pageable pageable);

    @Query("SELECT v FROM Vehicle v WHERE v.deleted = false AND v.organizationId = :organizationId AND " +
            "(LOWER(v.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.make) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.model) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.vin) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Vehicle> searchVehiclesByOrganizationId(@Param("search") String search,
                                                 @Param("organizationId") UUID organizationId,
                                                 Pageable pageable);

    @Query(value = "SELECT nextval('vehicle_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
