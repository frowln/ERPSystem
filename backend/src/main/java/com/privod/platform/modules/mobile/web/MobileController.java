package com.privod.platform.modules.mobile.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.mobile.service.MobileDeviceService;
import com.privod.platform.modules.mobile.web.dto.CreatePhotoCaptureRequest;
import com.privod.platform.modules.mobile.web.dto.MobileDeviceResponse;
import com.privod.platform.modules.mobile.web.dto.OfflineActionResponse;
import com.privod.platform.modules.mobile.web.dto.PhotoCaptureResponse;
import com.privod.platform.modules.mobile.web.dto.RegisterDeviceRequest;
import com.privod.platform.modules.mobile.web.dto.SubmitOfflineActionsRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
@Tag(name = "Mobile/PWA", description = "Mobile device, push notifications, offline sync, and photo capture endpoints")
@PreAuthorize("isAuthenticated()")
public class MobileController {

    private final MobileDeviceService mobileDeviceService;

    // ---- Device Registration ----

    @PostMapping("/devices")
    @Operation(summary = "Register or update a mobile device")
    public ResponseEntity<ApiResponse<MobileDeviceResponse>> registerDevice(
            @Valid @RequestBody RegisterDeviceRequest request) {
        MobileDeviceResponse response = mobileDeviceService.registerDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/devices")
    @Operation(summary = "List active devices for a user")
    public ResponseEntity<ApiResponse<List<MobileDeviceResponse>>> listDevices(@RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access devices for another user");
        }
        List<MobileDeviceResponse> devices = mobileDeviceService.findDevicesByUser(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(devices));
    }

    @PatchMapping("/devices/{id}/deactivate")
    @Operation(summary = "Deactivate a mobile device")
    public ResponseEntity<ApiResponse<Void>> deactivateDevice(@PathVariable UUID id) {
        mobileDeviceService.deactivateDevice(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Offline Actions ----

    @PostMapping("/offline-actions")
    @Operation(summary = "Submit an offline action for sync")
    public ResponseEntity<ApiResponse<OfflineActionResponse>> submitOfflineAction(
            @Valid @RequestBody SubmitOfflineActionsRequest request) {
        OfflineActionResponse response = mobileDeviceService.submitOfflineAction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/offline-actions/pending")
    @Operation(summary = "Get pending offline actions for a user")
    public ResponseEntity<ApiResponse<List<OfflineActionResponse>>> getPendingActions(@RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access offline actions for another user");
        }
        List<OfflineActionResponse> actions = mobileDeviceService.findPendingActions(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(actions));
    }

    @PatchMapping("/offline-actions/{id}/sync")
    @Operation(summary = "Mark an offline action as synced")
    public ResponseEntity<ApiResponse<OfflineActionResponse>> syncAction(@PathVariable UUID id) {
        OfflineActionResponse response = mobileDeviceService.syncOfflineAction(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Photo Captures ----

    @PostMapping("/photos")
    @Operation(summary = "Upload a photo capture with geo-tagging")
    public ResponseEntity<ApiResponse<PhotoCaptureResponse>> createPhoto(
            @Valid @RequestBody CreatePhotoCaptureRequest request) {
        PhotoCaptureResponse response = mobileDeviceService.createPhoto(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/photos/{id}")
    @Operation(summary = "Get photo by ID")
    public ResponseEntity<ApiResponse<PhotoCaptureResponse>> getPhoto(@PathVariable UUID id) {
        PhotoCaptureResponse response = mobileDeviceService.findPhotoById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/photos")
    @Operation(summary = "List photos by project")
    public ResponseEntity<ApiResponse<PageResponse<PhotoCaptureResponse>>> listPhotos(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "takenAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PhotoCaptureResponse> page = mobileDeviceService.findPhotosByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @DeleteMapping("/photos/{id}")
    @Operation(summary = "Delete a photo (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(@PathVariable UUID id) {
        mobileDeviceService.deletePhoto(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
