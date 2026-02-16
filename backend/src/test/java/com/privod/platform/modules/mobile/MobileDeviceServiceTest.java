package com.privod.platform.modules.mobile;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.mobile.domain.MobileDevice;
import com.privod.platform.modules.mobile.domain.MobilePlatform;
import com.privod.platform.modules.mobile.domain.OfflineAction;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import com.privod.platform.modules.mobile.domain.OfflineActionType;
import com.privod.platform.modules.mobile.domain.PushNotification;
import com.privod.platform.modules.mobile.repository.MobileDeviceRepository;
import com.privod.platform.modules.mobile.repository.OfflineActionRepository;
import com.privod.platform.modules.mobile.repository.PhotoCaptureRepository;
import com.privod.platform.modules.mobile.repository.PushNotificationRepository;
import com.privod.platform.modules.mobile.service.MobileDeviceService;
import com.privod.platform.modules.mobile.web.dto.MobileDeviceResponse;
import com.privod.platform.modules.mobile.web.dto.OfflineActionResponse;
import com.privod.platform.modules.mobile.web.dto.RegisterDeviceRequest;
import com.privod.platform.modules.mobile.web.dto.SubmitOfflineActionsRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
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
class MobileDeviceServiceTest {

    @Mock
    private MobileDeviceRepository deviceRepository;

    @Mock
    private PushNotificationRepository pushNotificationRepository;

    @Mock
    private OfflineActionRepository offlineActionRepository;

    @Mock
    private PhotoCaptureRepository photoCaptureRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MobileDeviceService mobileDeviceService;

    @Nested
    @DisplayName("Register Device")
    class RegisterDeviceTests {

        @Test
        @DisplayName("Should register new device")
        void registerDevice_NewDevice() {
            UUID userId = UUID.randomUUID();
            RegisterDeviceRequest request = new RegisterDeviceRequest(
                    userId, "token-abc-123", MobilePlatform.ANDROID,
                    "Samsung Galaxy S24", "14.0", "2.1.0"
            );

            when(deviceRepository.findByDeviceTokenAndDeletedFalse("token-abc-123"))
                    .thenReturn(Optional.empty());
            when(deviceRepository.save(any(MobileDevice.class))).thenAnswer(inv -> {
                MobileDevice d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            MobileDeviceResponse response = mobileDeviceService.registerDevice(request);

            assertThat(response.platform()).isEqualTo(MobilePlatform.ANDROID);
            assertThat(response.platformDisplayName()).isEqualTo("Android");
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("MobileDevice"), any(UUID.class));
        }

        @Test
        @DisplayName("Should update existing device with same token")
        void registerDevice_ExistingToken() {
            UUID userId = UUID.randomUUID();
            MobileDevice existing = MobileDevice.builder()
                    .userId(userId)
                    .deviceToken("token-abc-123")
                    .platform(MobilePlatform.IOS)
                    .appVersion("1.0.0")
                    .isActive(false)
                    .build();
            existing.setId(UUID.randomUUID());
            existing.setCreatedAt(Instant.now());

            RegisterDeviceRequest request = new RegisterDeviceRequest(
                    userId, "token-abc-123", MobilePlatform.IOS,
                    "iPhone 15", "17.0", "2.0.0"
            );

            when(deviceRepository.findByDeviceTokenAndDeletedFalse("token-abc-123"))
                    .thenReturn(Optional.of(existing));
            when(deviceRepository.save(any(MobileDevice.class))).thenReturn(existing);

            MobileDeviceResponse response = mobileDeviceService.registerDevice(request);

            assertThat(existing.getIsActive()).isTrue();
            assertThat(existing.getAppVersion()).isEqualTo("2.0.0");
        }
    }

    @Nested
    @DisplayName("Deactivate Device")
    class DeactivateDeviceTests {

        @Test
        @DisplayName("Should deactivate device")
        void deactivateDevice_Success() {
            UUID deviceId = UUID.randomUUID();
            MobileDevice device = MobileDevice.builder()
                    .userId(UUID.randomUUID())
                    .deviceToken("token-xyz")
                    .platform(MobilePlatform.WEB)
                    .isActive(true)
                    .build();
            device.setId(deviceId);

            when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.of(device));
            when(deviceRepository.save(any(MobileDevice.class))).thenReturn(device);

            mobileDeviceService.deactivateDevice(deviceId);

            assertThat(device.getIsActive()).isFalse();
            verify(auditService).logUpdate("MobileDevice", deviceId, "isActive", "true", "false");
        }

        @Test
        @DisplayName("Should throw when device not found")
        void deactivateDevice_NotFound() {
            UUID deviceId = UUID.randomUUID();
            when(deviceRepository.findByIdAndDeletedFalse(deviceId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mobileDeviceService.deactivateDevice(deviceId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Push Notifications")
    class PushNotificationTests {

        @Test
        @DisplayName("Should enqueue push for all active devices of user")
        void sendPush_EnqueuesForAllDevices() {
            UUID userId = UUID.randomUUID();
            MobileDevice d1 = MobileDevice.builder()
                    .userId(userId)
                    .deviceToken("t1")
                    .platform(MobilePlatform.ANDROID)
                    .isActive(true)
                    .build();
            d1.setId(UUID.randomUUID());
            MobileDevice d2 = MobileDevice.builder()
                    .userId(userId)
                    .deviceToken("t2")
                    .platform(MobilePlatform.IOS)
                    .isActive(true)
                    .build();
            d2.setId(UUID.randomUUID());

            when(deviceRepository.findByUserIdAndIsActiveTrueAndDeletedFalse(userId))
                    .thenReturn(List.of(d1, d2));
            when(pushNotificationRepository.save(any(PushNotification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            mobileDeviceService.sendPushNotification(
                    userId, "Новая задача", "Вам назначена задача", Map.of("taskId", "123"));

            verify(pushNotificationRepository, times(2)).save(any(PushNotification.class));
        }
    }

    @Nested
    @DisplayName("Offline Actions")
    class OfflineActionTests {

        @Test
        @DisplayName("Should submit offline action with PENDING status")
        void submitOfflineAction_SetsPendingStatus() {
            UUID userId = UUID.randomUUID();
            SubmitOfflineActionsRequest request = new SubmitOfflineActionsRequest(
                    userId, null, OfflineActionType.CREATE,
                    "DailyLog", null, Map.of("date", "2025-06-01")
            );

            when(offlineActionRepository.save(any(OfflineAction.class))).thenAnswer(inv -> {
                OfflineAction a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            OfflineActionResponse response = mobileDeviceService.submitOfflineAction(request);

            assertThat(response.status()).isEqualTo(OfflineActionStatus.PENDING);
            assertThat(response.actionType()).isEqualTo(OfflineActionType.CREATE);
            assertThat(response.actionTypeDisplayName()).isEqualTo("Создание");
        }

        @Test
        @DisplayName("Should sync offline action")
        void syncOfflineAction_SetsSyncedStatus() {
            UUID actionId = UUID.randomUUID();
            OfflineAction action = OfflineAction.builder()
                    .userId(UUID.randomUUID())
                    .actionType(OfflineActionType.UPDATE)
                    .entityType("Task")
                    .payload(Map.of("status", "done"))
                    .status(OfflineActionStatus.PENDING)
                    .build();
            action.setId(actionId);
            action.setCreatedAt(Instant.now());

            when(offlineActionRepository.findById(actionId)).thenReturn(Optional.of(action));
            when(offlineActionRepository.save(any(OfflineAction.class))).thenAnswer(inv -> inv.getArgument(0));

            OfflineActionResponse response = mobileDeviceService.syncOfflineAction(actionId);

            assertThat(response.status()).isEqualTo(OfflineActionStatus.SYNCED);
            assertThat(action.getSyncedAt()).isNotNull();
            verify(auditService).logStatusChange("OfflineAction", actionId, "PENDING", "SYNCED");
        }
    }
}
