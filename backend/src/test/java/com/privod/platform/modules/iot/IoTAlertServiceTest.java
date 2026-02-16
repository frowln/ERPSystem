package com.privod.platform.modules.iot;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.iot.domain.AlertSeverity;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.AlertType;
import com.privod.platform.modules.iot.domain.IoTAlert;
import com.privod.platform.modules.iot.repository.IoTAlertRepository;
import com.privod.platform.modules.iot.repository.IoTAlertRuleRepository;
import com.privod.platform.modules.iot.repository.IoTDeviceRepository;
import com.privod.platform.modules.iot.repository.IoTSensorDataRepository;
import com.privod.platform.modules.iot.service.IoTDeviceService;
import com.privod.platform.modules.iot.web.dto.IoTAlertResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IoTAlertServiceTest {

    @Mock
    private IoTDeviceRepository deviceRepository;

    @Mock
    private IoTSensorDataRepository sensorDataRepository;

    @Mock
    private IoTAlertRepository alertRepository;

    @Mock
    private IoTAlertRuleRepository alertRuleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private IoTDeviceService deviceService;

    @Test
    @DisplayName("Should acknowledge alert")
    void acknowledgeAlert_Success() {
        UUID alertId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        IoTAlert alert = IoTAlert.builder()
                .deviceId(UUID.randomUUID())
                .alertType(AlertType.THRESHOLD_EXCEEDED)
                .severity(AlertSeverity.HIGH)
                .message("Temperature exceeded 40C")
                .status(AlertStatus.ACTIVE)
                .build();
        alert.setId(alertId);
        alert.setCreatedAt(Instant.now());

        when(alertRepository.findByIdAndDeletedFalse(alertId)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(IoTAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        IoTAlertResponse response = deviceService.acknowledgeAlert(alertId, userId);

        assertThat(response.status()).isEqualTo(AlertStatus.ACKNOWLEDGED);
        assertThat(response.acknowledgedById()).isEqualTo(userId);
        verify(auditService).logStatusChange("IoTAlert", alertId, "ACTIVE", "ACKNOWLEDGED");
    }

    @Test
    @DisplayName("Should resolve alert and set resolvedAt")
    void resolveAlert_Success() {
        UUID alertId = UUID.randomUUID();
        IoTAlert alert = IoTAlert.builder()
                .deviceId(UUID.randomUUID())
                .alertType(AlertType.LOW_BATTERY)
                .severity(AlertSeverity.MEDIUM)
                .message("Battery below 10%")
                .status(AlertStatus.ACKNOWLEDGED)
                .build();
        alert.setId(alertId);
        alert.setCreatedAt(Instant.now());

        when(alertRepository.findByIdAndDeletedFalse(alertId)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(IoTAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        IoTAlertResponse response = deviceService.resolveAlert(alertId);

        assertThat(response.status()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(alert.getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should throw when alert not found for acknowledge")
    void acknowledgeAlert_NotFound() {
        UUID alertId = UUID.randomUUID();
        when(alertRepository.findByIdAndDeletedFalse(alertId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deviceService.acknowledgeAlert(alertId, UUID.randomUUID()))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
