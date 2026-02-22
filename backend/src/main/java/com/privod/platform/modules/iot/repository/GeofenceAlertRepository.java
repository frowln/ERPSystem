package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.GeofenceAlert;
import com.privod.platform.modules.iot.domain.GeofenceAlertType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeofenceAlertRepository extends JpaRepository<GeofenceAlert, UUID> {

    Optional<GeofenceAlert> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<GeofenceAlert> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<GeofenceAlert> findByOrganizationIdAndDeviceIdAndDeletedFalse(UUID organizationId,
                                                                        UUID deviceId,
                                                                        Pageable pageable);

    Page<GeofenceAlert> findByOrganizationIdAndAlertTypeAndDeletedFalse(UUID organizationId,
                                                                         GeofenceAlertType alertType,
                                                                         Pageable pageable);

    Page<GeofenceAlert> findByOrganizationIdAndAcknowledgedFalseAndDeletedFalse(UUID organizationId,
                                                                                  Pageable pageable);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndAcknowledgedFalseAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndTriggeredAtBetweenAndDeletedFalse(UUID organizationId,
                                                                     Instant from,
                                                                     Instant to);
}
