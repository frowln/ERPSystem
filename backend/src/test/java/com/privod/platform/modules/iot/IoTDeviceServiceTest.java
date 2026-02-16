package com.privod.platform.modules.iot;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.iot.domain.AlertSeverity;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.AlertType;
import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.domain.DeviceType;
import com.privod.platform.modules.iot.domain.IoTAlert;
import com.privod.platform.modules.iot.domain.IoTAlertRule;
import com.privod.platform.modules.iot.domain.IoTDevice;
import com.privod.platform.modules.iot.domain.IoTSensorData;
import com.privod.platform.modules.iot.domain.RuleCondition;
import com.privod.platform.modules.iot.repository.IoTAlertRepository;
import com.privod.platform.modules.iot.repository.IoTAlertRuleRepository;
import com.privod.platform.modules.iot.repository.IoTDeviceRepository;
import com.privod.platform.modules.iot.repository.IoTSensorDataRepository;
import com.privod.platform.modules.iot.service.IoTDeviceService;
import com.privod.platform.modules.iot.web.dto.CreateDeviceRequest;
import com.privod.platform.modules.iot.web.dto.IngestSensorDataRequest;
import com.privod.platform.modules.iot.web.dto.IoTDeviceResponse;
import com.privod.platform.modules.iot.web.dto.IoTSensorDataResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IoTDeviceServiceTest {

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

    private UUID deviceId;
    private IoTDevice testDevice;

    @BeforeEach
    void setUp() {
        deviceId = UUID.randomUUID();
        testDevice = IoTDevice.builder()
                .code("IOT-000001")
                .name("Датчик температуры #1")
                .deviceType(DeviceType.TEMPERATURE)
                .serialNumber("SN-TEMP-001")
                .projectId(UUID.randomUUID())
                .location("Корпус А, этаж 3")
                .installationDate(LocalDate.of(2025, 6, 1))
                .status(DeviceStatus.ONLINE)
                .batteryLevel(85)
                .firmwareVersion("1.2.3")
                .build();
        testDevice.setId(deviceId);
        testDevice.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Device")
    class CreateDeviceTests {

        @Test
        @DisplayName("Should create device with OFFLINE status")
        void create_SetsOfflineStatus() {
            CreateDeviceRequest request = new CreateDeviceRequest(
                    "Датчик влажности",
                    DeviceType.HUMIDITY,
                    "SN-HUM-001",
                    UUID.randomUUID(),
                    "Корпус Б, подвал",
                    LocalDate.now(),
                    "2.0.0"
            );

            when(deviceRepository.count()).thenReturn(5L);
            when(deviceRepository.save(any(IoTDevice.class))).thenAnswer(inv -> {
                IoTDevice d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            IoTDeviceResponse response = deviceService.createDevice(request);

            assertThat(response.status()).isEqualTo(DeviceStatus.OFFLINE);
            assertThat(response.code()).isEqualTo("IOT-000006");
            assertThat(response.deviceType()).isEqualTo(DeviceType.HUMIDITY);
            assertThat(response.deviceTypeDisplayName()).isEqualTo("Влажность");
            verify(auditService).logCreate(eq("IoTDevice"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Ingest Sensor Data")
    class IngestDataTests {

        @Test
        @DisplayName("Should ingest data and update device status to ONLINE")
        void ingestData_UpdatesDeviceToOnline() {
            testDevice.setStatus(DeviceStatus.OFFLINE);

            when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.of(testDevice));
            when(alertRuleRepository.findByDeviceTypeAndIsActiveTrueAndDeletedFalse(DeviceType.TEMPERATURE))
                    .thenReturn(Collections.emptyList());
            when(sensorDataRepository.save(any(IoTSensorData.class))).thenAnswer(inv -> {
                IoTSensorData d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });
            when(deviceRepository.save(any(IoTDevice.class))).thenReturn(testDevice);

            IngestSensorDataRequest request = new IngestSensorDataRequest(
                    deviceId, null, "temperature", 22.5, "celsius");

            IoTSensorDataResponse response = deviceService.ingestData(request);

            assertThat(response.metricValue()).isEqualTo(22.5);
            assertThat(response.isAnomaly()).isFalse();
            assertThat(testDevice.getStatus()).isEqualTo(DeviceStatus.ONLINE);
        }

        @Test
        @DisplayName("Should trigger alert when threshold exceeded")
        void ingestData_TriggersAlert() {
            IoTAlertRule rule = IoTAlertRule.builder()
                    .deviceType(DeviceType.TEMPERATURE)
                    .metricName("temperature")
                    .condition(RuleCondition.GT)
                    .thresholdValue(40.0)
                    .severity(AlertSeverity.HIGH)
                    .isActive(true)
                    .build();

            when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.of(testDevice));
            when(alertRuleRepository.findByDeviceTypeAndIsActiveTrueAndDeletedFalse(DeviceType.TEMPERATURE))
                    .thenReturn(List.of(rule));
            when(sensorDataRepository.save(any(IoTSensorData.class))).thenAnswer(inv -> {
                IoTSensorData d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });
            when(alertRepository.save(any(IoTAlert.class))).thenAnswer(inv -> inv.getArgument(0));
            when(deviceRepository.save(any(IoTDevice.class))).thenReturn(testDevice);

            IngestSensorDataRequest request = new IngestSensorDataRequest(
                    deviceId, null, "temperature", 45.0, "celsius");

            IoTSensorDataResponse response = deviceService.ingestData(request);

            assertThat(response.isAnomaly()).isTrue();
            verify(alertRepository).save(any(IoTAlert.class));
        }

        @Test
        @DisplayName("Should throw when device not found during ingest")
        void ingestData_DeviceNotFound() {
            when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.empty());

            IngestSensorDataRequest request = new IngestSensorDataRequest(
                    deviceId, null, "temperature", 22.0, "celsius");

            assertThatThrownBy(() -> deviceService.ingestData(request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Test
    @DisplayName("Should find device by ID")
    void findDeviceById_Success() {
        when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.of(testDevice));

        IoTDeviceResponse response = deviceService.findDeviceById(deviceId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("IOT-000001");
        assertThat(response.statusDisplayName()).isEqualTo("В сети");
    }

    @Test
    @DisplayName("Should soft delete device")
    void deleteDevice_SoftDeletes() {
        when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.of(testDevice));
        when(deviceRepository.save(any(IoTDevice.class))).thenReturn(testDevice);

        deviceService.deleteDevice(deviceId);

        assertThat(testDevice.isDeleted()).isTrue();
        verify(deviceRepository).save(testDevice);
        verify(auditService).logDelete("IoTDevice", deviceId);
    }
}
