package com.privod.platform.modules.chatter.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.chatter.domain.ActivityStatus;
import com.privod.platform.modules.chatter.service.ActivityService;
import com.privod.platform.modules.chatter.web.dto.ActivityResponse;
import com.privod.platform.modules.chatter.web.dto.CreateActivityRequest;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/chatter/activities")
@RequiredArgsConstructor
@Tag(name = "Chatter - Activities", description = "Activity management for entity tracking")
@PreAuthorize("isAuthenticated()")
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    @Operation(summary = "Create a new activity")
    public ResponseEntity<ApiResponse<ActivityResponse>> create(
            @Valid @RequestBody CreateActivityRequest request) {
        ActivityResponse response = activityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List activities for an entity")
    public ResponseEntity<ApiResponse<PageResponse<ActivityResponse>>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ActivityResponse> page = activityService.getActivities(entityType, entityId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/my")
    @Operation(summary = "List activities assigned to a user")
    public ResponseEntity<ApiResponse<PageResponse<ActivityResponse>>> myActivities(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) ActivityStatus status,
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access activities for another user");
        }
        Page<ActivityResponse> page = activityService.getMyActivities(currentUserId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/{id}/done")
    @Operation(summary = "Mark an activity as done")
    public ResponseEntity<ApiResponse<ActivityResponse>> markDone(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID completedById) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (completedById != null && !completedById.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot complete an activity on behalf of another user");
        }
        ActivityResponse response = activityService.markDone(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an activity")
    public ResponseEntity<ApiResponse<ActivityResponse>> cancel(@PathVariable UUID id) {
        ActivityResponse response = activityService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/overdue")
    @Operation(summary = "List all overdue activities")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> overdue() {
        List<ActivityResponse> list = activityService.getOverdueActivities();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/pending-count")
    @Operation(summary = "Get pending activity count for a user")
    public ResponseEntity<ApiResponse<Long>> pendingCount(@RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access pending count for another user");
        }
        long count = activityService.getPendingCount(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an activity")
    public ResponseEntity<ApiResponse<ActivityResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateActivityRequest request) {
        ActivityResponse response = activityService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an activity (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
