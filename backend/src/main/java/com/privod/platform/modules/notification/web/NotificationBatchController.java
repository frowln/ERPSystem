package com.privod.platform.modules.notification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.notification.service.NotificationBatchService;
import com.privod.platform.modules.notification.web.dto.CreateBatchRequest;
import com.privod.platform.modules.notification.web.dto.NotificationBatchResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/notification-batches")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN')")
@Tag(name = "Notification Batches", description = "Batch notification management endpoints (admin only)")
public class NotificationBatchController {

    private final NotificationBatchService batchService;

    @GetMapping
    @Operation(summary = "List notification batches")
    public ResponseEntity<ApiResponse<PageResponse<NotificationBatchResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NotificationBatchResponse> page = batchService.listBatches(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get notification batch by ID")
    public ResponseEntity<ApiResponse<NotificationBatchResponse>> getById(@PathVariable UUID id) {
        NotificationBatchResponse response = batchService.getBatch(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create a new notification batch")
    public ResponseEntity<ApiResponse<NotificationBatchResponse>> create(
            @Valid @RequestBody CreateBatchRequest request) {
        NotificationBatchResponse response = batchService.createBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Send a notification batch")
    public ResponseEntity<ApiResponse<NotificationBatchResponse>> send(@PathVariable UUID id) {
        NotificationBatchResponse response = batchService.sendBatch(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Get notification batch status")
    public ResponseEntity<ApiResponse<NotificationBatchResponse>> getStatus(@PathVariable UUID id) {
        NotificationBatchResponse response = batchService.getStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a notification batch before sending")
    public ResponseEntity<ApiResponse<NotificationBatchResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBatchRequest request) {
        NotificationBatchResponse response = batchService.updateBatch(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification batch (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
