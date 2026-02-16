package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.DeviceType;
import com.privod.platform.modules.iot.domain.IoTAlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IoTAlertRuleRepository extends JpaRepository<IoTAlertRule, UUID> {

    List<IoTAlertRule> findByDeviceTypeAndIsActiveTrueAndDeletedFalse(DeviceType deviceType);

    List<IoTAlertRule> findByIsActiveTrueAndDeletedFalse();
}
