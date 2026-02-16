package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.IoTAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IoTAlertRepository extends JpaRepository<IoTAlert, UUID> {

    Optional<IoTAlert> findByIdAndDeletedFalse(UUID id);

    Page<IoTAlert> findByDeviceIdAndDeletedFalse(UUID deviceId, Pageable pageable);

    Page<IoTAlert> findByStatusAndDeletedFalse(AlertStatus status, Pageable pageable);

    Page<IoTAlert> findByDeletedFalse(Pageable pageable);

    long countByStatusAndDeletedFalse(AlertStatus status);
}
