package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.IotEquipmentDevice;
import com.privod.platform.modules.iot.domain.IotDeviceType;
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
public interface IotEquipmentDeviceRepository extends JpaRepository<IotEquipmentDevice, UUID> {

    Optional<IotEquipmentDevice> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<IotEquipmentDevice> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<IotEquipmentDevice> findByOrganizationIdAndDeviceTypeAndDeletedFalse(UUID organizationId,
                                                                               IotDeviceType deviceType,
                                                                               Pageable pageable);

    List<IotEquipmentDevice> findByOrganizationIdAndActiveTrueAndDeletedFalse(UUID organizationId);

    Page<IotEquipmentDevice> findByOrganizationIdAndActiveTrueAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<IotEquipmentDevice> findByOrganizationIdAndEquipmentIdAndDeletedFalse(UUID organizationId, UUID equipmentId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndActiveTrueAndDeletedFalse(UUID organizationId);

    @Query("SELECT d FROM IotEquipmentDevice d WHERE d.organizationId = :orgId AND d.deleted = false AND " +
            "(LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(d.deviceSerial) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(d.manufacturer) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<IotEquipmentDevice> searchByOrganizationId(@Param("search") String search,
                                                     @Param("orgId") UUID organizationId,
                                                     Pageable pageable);
}
