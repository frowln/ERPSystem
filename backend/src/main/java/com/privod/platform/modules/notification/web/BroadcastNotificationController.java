package com.privod.platform.modules.notification.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.notification.service.BroadcastNotificationService;
import com.privod.platform.modules.notification.web.dto.BroadcastResponse;
import com.privod.platform.modules.notification.web.dto.CreateBroadcastRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/broadcasts")
@RequiredArgsConstructor
@Tag(name = "Broadcast Notifications", description = "Admin broadcast announcements to all users")
public class BroadcastNotificationController {

    private final BroadcastNotificationService broadcastNotificationService;

    @GetMapping
    @Operation(summary = "List active broadcast notifications for current organization")
    public ResponseEntity<ApiResponse<List<BroadcastResponse>>> list() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<BroadcastResponse> broadcasts = broadcastNotificationService.getActiveBroadcasts(orgId);
        return ResponseEntity.ok(ApiResponse.ok(broadcasts));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a broadcast notification (ADMIN only)")
    public ResponseEntity<ApiResponse<BroadcastResponse>> create(
            @Valid @RequestBody CreateBroadcastRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();
        BroadcastResponse response = broadcastNotificationService.create(request, orgId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a broadcast notification (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        broadcastNotificationService.deactivate(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
