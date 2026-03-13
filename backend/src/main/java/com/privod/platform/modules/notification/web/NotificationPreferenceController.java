package com.privod.platform.modules.notification.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.notification.service.NotificationPreferenceService;
import com.privod.platform.modules.notification.web.dto.NotificationPreferenceResponse;
import com.privod.platform.modules.notification.web.dto.UpdateNotificationPreferenceRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notification-preferences")
@RequiredArgsConstructor
@Tag(name = "Notification Preferences", description = "Per-user notification preference management")
@PreAuthorize("isAuthenticated()")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    @Operation(summary = "Get current user's notification preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceResponse>>> getPreferences() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<NotificationPreferenceResponse> preferences = preferenceService.getPreferences(userId, orgId);
        return ResponseEntity.ok(ApiResponse.ok(preferences));
    }

    @PutMapping
    @Operation(summary = "Update a notification preference for the current user")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreference(
            @Valid @RequestBody UpdateNotificationPreferenceRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        NotificationPreferenceResponse response = preferenceService.updatePreference(
                userId, orgId, request.channel(), request.category(), request.enabled());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
