package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.IotTelemetryPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IotTelemetryPointRepository extends JpaRepository<IotTelemetryPoint, UUID> {

    Page<IotTelemetryPoint> findByDeviceIdAndDeletedFalse(UUID deviceId, Pageable pageable);

    Page<IotTelemetryPoint> findByDeviceIdAndRecordedAtBetweenAndDeletedFalse(UUID deviceId,
                                                                               Instant from,
                                                                               Instant to,
                                                                               Pageable pageable);

    @Query("SELECT tp FROM IotTelemetryPoint tp WHERE tp.deviceId = :deviceId AND tp.deleted = false " +
            "ORDER BY tp.recordedAt DESC LIMIT 1")
    Optional<IotTelemetryPoint> findLatestByDeviceId(@Param("deviceId") UUID deviceId);

    Page<IotTelemetryPoint> findByOrganizationIdAndRecordedAtBetweenAndDeletedFalse(UUID organizationId,
                                                                                     Instant from,
                                                                                     Instant to,
                                                                                     Pageable pageable);

    @Query("SELECT AVG(tp.fuelLevelPercent) FROM IotTelemetryPoint tp " +
            "WHERE tp.organizationId = :orgId AND tp.deleted = false AND tp.fuelLevelPercent IS NOT NULL " +
            "AND tp.recordedAt = (SELECT MAX(tp2.recordedAt) FROM IotTelemetryPoint tp2 " +
            "WHERE tp2.deviceId = tp.deviceId AND tp2.deleted = false)")
    Optional<Double> findAvgFuelLevelByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(tp.engineHours), 0) FROM IotTelemetryPoint tp " +
            "WHERE tp.organizationId = :orgId AND tp.deleted = false AND tp.engineHours IS NOT NULL " +
            "AND tp.recordedAt = (SELECT MAX(tp2.recordedAt) FROM IotTelemetryPoint tp2 " +
            "WHERE tp2.deviceId = tp.deviceId AND tp2.deleted = false)")
    Double findTotalEngineHoursByOrganizationId(@Param("orgId") UUID organizationId);
}
