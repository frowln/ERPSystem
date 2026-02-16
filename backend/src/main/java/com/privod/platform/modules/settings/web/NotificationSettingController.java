package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.domain.NotificationType;
import com.privod.platform.modules.settings.service.NotificationSettingService;
import com.privod.platform.modules.settings.web.dto.BulkNotificationSettingRequest;
import com.privod.platform.modules.settings.web.dto.NotificationSettingResponse;
import com.privod.platform.modules.settings.web.dto.UpdateNotificationSettingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/settings/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification Settings", description = "Управление настройками уведомлений пользователя")
@PreAuthorize("isAuthenticated()")
public class NotificationSettingController {

    private final NotificationSettingService notificationSettingService;

    @GetMapping
    @Operation(summary = "Получить все настройки уведомлений текущего пользователя")
    public ResponseEntity<ApiResponse<List<NotificationSettingResponse>>> getMySettings(
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        List<NotificationSettingResponse> settings = notificationSettingService.getUserSettings(userId);
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/type/{notificationType}")
    @Operation(summary = "Получить настройки уведомлений по типу")
    public ResponseEntity<ApiResponse<List<NotificationSettingResponse>>> getByType(
            @PathVariable NotificationType notificationType,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        List<NotificationSettingResponse> settings =
                notificationSettingService.getUserSettingsByType(userId, notificationType);
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/defaults")
    @Operation(summary = "Получить настройки уведомлений по умолчанию")
    public ResponseEntity<ApiResponse<List<NotificationSettingResponse>>> getDefaults() {
        List<NotificationSettingResponse> defaults = notificationSettingService.getDefaults();
        return ResponseEntity.ok(ApiResponse.ok(defaults));
    }

    @PutMapping
    @Operation(summary = "Обновить одну настройку уведомления")
    public ResponseEntity<ApiResponse<NotificationSettingResponse>> updateSetting(
            @Valid @RequestBody UpdateNotificationSettingRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        NotificationSettingResponse response = notificationSettingService.updateSetting(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Массовое обновление настроек уведомлений")
    public ResponseEntity<ApiResponse<List<NotificationSettingResponse>>> bulkUpdate(
            @Valid @RequestBody BulkNotificationSettingRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        List<NotificationSettingResponse> results = notificationSettingService.bulkUpdate(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    private UUID extractUserId(Authentication authentication) {
        // The user ID extraction depends on your CustomUserDetails implementation.
        // Common patterns: cast to CustomUserDetails and call getId(),
        // or parse from the principal name if it's a UUID.
        String name = authentication.getName();
        try {
            return UUID.fromString(name);
        } catch (IllegalArgumentException e) {
            // If the name is not a UUID, we use a deterministic UUID based on the name.
            // In a production system, you'd use CustomUserDetails.getId() instead.
            return UUID.nameUUIDFromBytes(name.getBytes());
        }
    }
}
