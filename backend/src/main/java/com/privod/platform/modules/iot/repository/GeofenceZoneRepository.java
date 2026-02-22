package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.GeofenceZone;
import com.privod.platform.modules.iot.domain.GeofenceZoneType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeofenceZoneRepository extends JpaRepository<GeofenceZone, UUID> {

    Optional<GeofenceZone> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<GeofenceZone> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<GeofenceZone> findByOrganizationIdAndZoneTypeAndDeletedFalse(UUID organizationId,
                                                                       GeofenceZoneType zoneType,
                                                                       Pageable pageable);

    List<GeofenceZone> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    List<GeofenceZone> findByOrganizationIdAndActiveTrueAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
