package com.privod.platform.modules.iot;

import com.privod.platform.modules.iot.domain.AlertSeverity;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.AlertType;
import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.domain.DeviceType;
import com.privod.platform.modules.iot.domain.RuleCondition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IoTEnumTest {

    @Test
    @DisplayName("DeviceType should have Russian display names")
    void deviceType_HasRussianNames() {
        assertThat(DeviceType.TEMPERATURE.getDisplayName()).isEqualTo("Температура");
        assertThat(DeviceType.HUMIDITY.getDisplayName()).isEqualTo("Влажность");
        assertThat(DeviceType.VIBRATION.getDisplayName()).isEqualTo("Вибрация");
        assertThat(DeviceType.NOISE.getDisplayName()).isEqualTo("Шум");
        assertThat(DeviceType.DUST.getDisplayName()).isEqualTo("Пыль");
        assertThat(DeviceType.CAMERA.getDisplayName()).isEqualTo("Камера");
        assertThat(DeviceType.GPS_TRACKER.getDisplayName()).isEqualTo("GPS-трекер");
        assertThat(DeviceType.CONCRETE_SENSOR.getDisplayName()).isEqualTo("Датчик бетона");
        assertThat(DeviceType.values()).hasSize(8);
    }

    @Test
    @DisplayName("DeviceStatus should have Russian display names")
    void deviceStatus_HasRussianNames() {
        assertThat(DeviceStatus.ONLINE.getDisplayName()).isEqualTo("В сети");
        assertThat(DeviceStatus.OFFLINE.getDisplayName()).isEqualTo("Не в сети");
        assertThat(DeviceStatus.MAINTENANCE.getDisplayName()).isEqualTo("Обслуживание");
        assertThat(DeviceStatus.DECOMMISSIONED.getDisplayName()).isEqualTo("Списано");
        assertThat(DeviceStatus.values()).hasSize(4);
    }

    @Test
    @DisplayName("AlertType should have Russian display names")
    void alertType_HasRussianNames() {
        assertThat(AlertType.THRESHOLD_EXCEEDED.getDisplayName()).isEqualTo("Превышение порога");
        assertThat(AlertType.DEVICE_OFFLINE.getDisplayName()).isEqualTo("Устройство офлайн");
        assertThat(AlertType.LOW_BATTERY.getDisplayName()).isEqualTo("Низкий заряд");
        assertThat(AlertType.ANOMALY.getDisplayName()).isEqualTo("Аномалия");
        assertThat(AlertType.values()).hasSize(4);
    }

    @Test
    @DisplayName("AlertSeverity should have Russian display names")
    void alertSeverity_HasRussianNames() {
        assertThat(AlertSeverity.LOW.getDisplayName()).isEqualTo("Низкая");
        assertThat(AlertSeverity.MEDIUM.getDisplayName()).isEqualTo("Средняя");
        assertThat(AlertSeverity.HIGH.getDisplayName()).isEqualTo("Высокая");
        assertThat(AlertSeverity.CRITICAL.getDisplayName()).isEqualTo("Критическая");
        assertThat(AlertSeverity.values()).hasSize(4);
    }

    @Test
    @DisplayName("AlertStatus should have Russian display names")
    void alertStatus_HasRussianNames() {
        assertThat(AlertStatus.ACTIVE.getDisplayName()).isEqualTo("Активное");
        assertThat(AlertStatus.ACKNOWLEDGED.getDisplayName()).isEqualTo("Подтверждено");
        assertThat(AlertStatus.RESOLVED.getDisplayName()).isEqualTo("Решено");
        assertThat(AlertStatus.values()).hasSize(3);
    }

    @Test
    @DisplayName("RuleCondition should have Russian display names")
    void ruleCondition_HasRussianNames() {
        assertThat(RuleCondition.GT.getDisplayName()).isEqualTo("Больше");
        assertThat(RuleCondition.LT.getDisplayName()).isEqualTo("Меньше");
        assertThat(RuleCondition.EQ.getDisplayName()).isEqualTo("Равно");
        assertThat(RuleCondition.BETWEEN.getDisplayName()).isEqualTo("Между");
        assertThat(RuleCondition.values()).hasSize(4);
    }
}
