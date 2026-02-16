package com.privod.platform.modules.mobile.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.mobile.domain.MobileDevice;
import com.privod.platform.modules.mobile.domain.OfflineAction;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import com.privod.platform.modules.mobile.domain.PhotoCapture;
import com.privod.platform.modules.mobile.domain.PushNotification;
import com.privod.platform.modules.mobile.domain.PushNotificationStatus;
import com.privod.platform.modules.mobile.repository.MobileDeviceRepository;
import com.privod.platform.modules.mobile.repository.OfflineActionRepository;
import com.privod.platform.modules.mobile.repository.PhotoCaptureRepository;
import com.privod.platform.modules.mobile.repository.PushNotificationRepository;
import com.privod.platform.modules.mobile.web.dto.CreatePhotoCaptureRequest;
import com.privod.platform.modules.mobile.web.dto.MobileDeviceResponse;
import com.privod.platform.modules.mobile.web.dto.OfflineActionResponse;
import com.privod.platform.modules.mobile.web.dto.PhotoCaptureResponse;
import com.privod.platform.modules.mobile.web.dto.RegisterDeviceRequest;
import com.privod.platform.modules.mobile.web.dto.SubmitOfflineActionsRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileDeviceService {

    private final MobileDeviceRepository deviceRepository;
    private final PushNotificationRepository pushNotificationRepository;
    private final OfflineActionRepository offlineActionRepository;
    private final PhotoCaptureRepository photoCaptureRepository;
    private final AuditService auditService;

    // ---- Device Registration ----

    @Transactional
    public MobileDeviceResponse registerDevice(RegisterDeviceRequest request) {
        // Check if device token already registered
        var existing = deviceRepository.findByDeviceTokenAndDeletedFalse(request.deviceToken());
        if (existing.isPresent()) {
            MobileDevice device = existing.get();
            device.setLastActiveAt(Instant.now());
            device.setAppVersion(request.appVersion());
            device.setOsVersion(request.osVersion());
            device.setIsActive(true);
            device = deviceRepository.save(device);
            log.info("Mobile device updated: token={}, userId={}", request.deviceToken(), request.userId());
            return MobileDeviceResponse.fromEntity(device);
        }

        MobileDevice device = MobileDevice.builder()
                .userId(request.userId())
                .deviceToken(request.deviceToken())
                .platform(request.platform())
                .deviceModel(request.deviceModel())
                .osVersion(request.osVersion())
                .appVersion(request.appVersion())
                .lastActiveAt(Instant.now())
                .isActive(true)
                .build();

        device = deviceRepository.save(device);
        auditService.logCreate("MobileDevice", device.getId());

        log.info("Mobile device registered: platform={}, userId={} ({})",
                device.getPlatform(), device.getUserId(), device.getId());
        return MobileDeviceResponse.fromEntity(device);
    }

    @Transactional(readOnly = true)
    public List<MobileDeviceResponse> findDevicesByUser(UUID userId) {
        return deviceRepository.findByUserIdAndIsActiveTrueAndDeletedFalse(userId)
                .stream()
                .map(MobileDeviceResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deactivateDevice(UUID deviceId) {
        MobileDevice device = deviceRepository.findByIdAndDeletedFalse(deviceId)
                .orElseThrow(() -> new EntityNotFoundException("Mobile device not found: " + deviceId));
        device.setIsActive(false);
        deviceRepository.save(device);
        auditService.logUpdate("MobileDevice", deviceId, "isActive", "true", "false");
        log.info("Mobile device deactivated: {}", deviceId);
    }

    // ---- Push Notifications ----

    @Transactional
    public void sendPushNotification(UUID userId, String title, String body, Map<String, Object> data) {
        List<MobileDevice> devices = deviceRepository.findByUserIdAndIsActiveTrueAndDeletedFalse(userId);

        for (MobileDevice device : devices) {
            PushNotification notification = PushNotification.builder()
                    .deviceId(device.getId())
                    .title(title)
                    .body(body)
                    .data(data)
                    .status(PushNotificationStatus.PENDING)
                    .build();
            pushNotificationRepository.save(notification);
        }

        log.info("Push notifications enqueued for user {}: {} devices", userId, devices.size());
    }

    // ---- Offline Actions ----

    @Transactional
    public OfflineActionResponse submitOfflineAction(SubmitOfflineActionsRequest request) {
        OfflineAction action = OfflineAction.builder()
                .userId(request.userId())
                .deviceId(request.deviceId())
                .actionType(request.actionType())
                .entityType(request.entityType())
                .entityId(request.entityId())
                .payload(request.payload())
                .status(OfflineActionStatus.PENDING)
                .build();

        action = offlineActionRepository.save(action);
        auditService.logCreate("OfflineAction", action.getId());

        log.info("Offline action submitted: type={}, entity={}/{}", request.actionType(),
                request.entityType(), request.entityId());
        return OfflineActionResponse.fromEntity(action);
    }

    @Transactional
    public OfflineActionResponse syncOfflineAction(UUID actionId) {
        OfflineAction action = offlineActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("Offline action not found: " + actionId));

        action.setStatus(OfflineActionStatus.SYNCED);
        action.setSyncedAt(Instant.now());
        action = offlineActionRepository.save(action);
        auditService.logStatusChange("OfflineAction", actionId, "PENDING", "SYNCED");

        log.info("Offline action synced: {}", actionId);
        return OfflineActionResponse.fromEntity(action);
    }

    @Transactional(readOnly = true)
    public List<OfflineActionResponse> findPendingActions(UUID userId) {
        return offlineActionRepository.findByUserIdAndStatusAndDeletedFalse(userId, OfflineActionStatus.PENDING)
                .stream()
                .map(OfflineActionResponse::fromEntity)
                .toList();
    }

    // ---- Photo Captures ----

    @Transactional
    public PhotoCaptureResponse createPhoto(CreatePhotoCaptureRequest request) {
        PhotoCapture photo = PhotoCapture.builder()
                .userId(request.userId())
                .projectId(request.projectId())
                .photoUrl(request.photoUrl())
                .thumbnailUrl(request.thumbnailUrl())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .takenAt(request.takenAt() != null ? request.takenAt() : Instant.now())
                .entityType(request.entityType())
                .entityId(request.entityId())
                .description(request.description())
                .tags(request.tags())
                .build();

        photo = photoCaptureRepository.save(photo);
        auditService.logCreate("PhotoCapture", photo.getId());

        log.info("Photo captured: projectId={}, userId={} ({})", request.projectId(), request.userId(), photo.getId());
        return PhotoCaptureResponse.fromEntity(photo);
    }

    @Transactional(readOnly = true)
    public PhotoCaptureResponse findPhotoById(UUID id) {
        PhotoCapture photo = photoCaptureRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Photo not found: " + id));
        return PhotoCaptureResponse.fromEntity(photo);
    }

    @Transactional(readOnly = true)
    public Page<PhotoCaptureResponse> findPhotosByProject(UUID projectId, Pageable pageable) {
        return photoCaptureRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(PhotoCaptureResponse::fromEntity);
    }

    @Transactional
    public void deletePhoto(UUID id) {
        PhotoCapture photo = photoCaptureRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Photo not found: " + id));
        photo.softDelete();
        photoCaptureRepository.save(photo);
        auditService.logDelete("PhotoCapture", id);
        log.info("Photo soft-deleted: {}", id);
    }
}
