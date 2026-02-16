package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.IoTSensorData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface IoTSensorDataRepository extends JpaRepository<IoTSensorData, UUID> {

    Page<IoTSensorData> findByDeviceIdAndDeletedFalse(UUID deviceId, Pageable pageable);

    List<IoTSensorData> findByDeviceIdAndTimestampBetweenAndDeletedFalse(
            UUID deviceId, Instant from, Instant to);

    List<IoTSensorData> findByDeviceIdAndMetricNameAndTimestampBetweenAndDeletedFalse(
            UUID deviceId, String metricName, Instant from, Instant to);

    long countByDeviceIdAndIsAnomalyTrueAndDeletedFalse(UUID deviceId);
}
