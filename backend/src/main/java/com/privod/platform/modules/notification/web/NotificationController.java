package com.privod.platform.modules.notification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.notification.web.dto.NotificationResponse;
import com.privod.platform.modules.notification.web.dto.SendNotificationRequest;
import com.privod.platform.modules.notification.web.dto.UnreadCountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification management endpoints")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications for a user")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access notifications for another user");
        }
        Page<NotificationResponse> page = notificationService.getMyNotifications(currentUserId, isRead, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count for a user")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access unread count for another user");
        }
        UnreadCountResponse response = notificationService.getUnreadCount(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM')")
    @Operation(summary = "Send a notification to a user")
    public ResponseEntity<ApiResponse<NotificationResponse>> send(
            @Valid @RequestBody SendNotificationRequest request) {
        NotificationResponse response = notificationService.send(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        NotificationResponse response = notificationService.markReadForUser(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read for a user")
    public ResponseEntity<ApiResponse<Integer>> markAllRead(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot mark notifications for another user");
        }
        int count = notificationService.markAllRead(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        notificationService.deleteNotificationForUser(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/old")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete old read notifications")
    public ResponseEntity<ApiResponse<Integer>> deleteOld(
            @RequestParam(defaultValue = "90") int daysOld) {
        int count = notificationService.deleteOld(daysOld);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @DeleteMapping("/expired")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete expired notifications")
    public ResponseEntity<ApiResponse<Integer>> deleteExpired() {
        int count = notificationService.deleteExpired();
        return ResponseEntity.ok(ApiResponse.ok(count));
    }
}
