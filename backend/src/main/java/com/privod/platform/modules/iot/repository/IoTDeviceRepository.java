package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.domain.DeviceType;
import com.privod.platform.modules.iot.domain.IoTDevice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IoTDeviceRepository extends JpaRepository<IoTDevice, UUID> {

    Optional<IoTDevice> findByIdAndDeletedFalse(UUID id);

    Optional<IoTDevice> findByCodeAndDeletedFalse(String code);

    Page<IoTDevice> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<IoTDevice> findByDeviceTypeAndDeletedFalse(DeviceType deviceType, Pageable pageable);

    Page<IoTDevice> findByStatusAndDeletedFalse(DeviceStatus status, Pageable pageable);

    Page<IoTDevice> findByDeletedFalse(Pageable pageable);

    long countByStatusAndDeletedFalse(DeviceStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
