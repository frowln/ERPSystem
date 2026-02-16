package com.privod.platform.modules.changeManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.service.ChangeEventService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventFromRfiRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeEventRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/change-events")
@RequiredArgsConstructor
@Tag(name = "Change Events", description = "Change event management endpoints")
public class ChangeEventController {

    private final ChangeEventService changeEventService;

    @GetMapping
    @Operation(summary = "List change events with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<ChangeEventResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ChangeEventStatus status,
            @RequestParam(required = false) ChangeEventSource source,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ChangeEventResponse> page = changeEventService.listChangeEvents(search, status, source, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get change event by ID")
    public ResponseEntity<ApiResponse<ChangeEventResponse>> getById(@PathVariable UUID id) {
        ChangeEventResponse response = changeEventService.getChangeEvent(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new change event")
    public ResponseEntity<ApiResponse<ChangeEventResponse>> create(
            @Valid @RequestBody CreateChangeEventRequest request) {
        ChangeEventResponse response = changeEventService.createChangeEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/from-rfi")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a change event from an RFI")
    public ResponseEntity<ApiResponse<ChangeEventResponse>> createFromRfi(
            @Valid @RequestBody CreateChangeEventFromRfiRequest request) {
        ChangeEventResponse response = changeEventService.createFromRfi(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Update an existing change event")
    public ResponseEntity<ApiResponse<ChangeEventResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChangeEventRequest request) {
        ChangeEventResponse response = changeEventService.updateChangeEvent(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Change status of a change event")
    public ResponseEntity<ApiResponse<ChangeEventResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeEventStatusRequest request) {
        ChangeEventResponse response = changeEventService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a change event")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        changeEventService.deleteChangeEvent(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
