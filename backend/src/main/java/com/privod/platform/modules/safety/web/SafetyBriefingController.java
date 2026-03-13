package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyBriefingService;
import com.privod.platform.modules.safety.web.dto.CreateSafetyBriefingRequest;
import com.privod.platform.modules.safety.web.dto.SafetyBriefingResponse;
import com.privod.platform.modules.safety.web.dto.UpdateSafetyBriefingRequest;
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

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/safety/briefings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
@Tag(name = "Safety Briefings", description = "Safety briefing journal per GOST 12.0.004-2015")
public class SafetyBriefingController {

    private final SafetyBriefingService briefingService;

    @GetMapping
    @Operation(summary = "List all briefings with filters")
    public ResponseEntity<ApiResponse<PageResponse<SafetyBriefingResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String briefingType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "briefingDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyBriefingResponse> page = briefingService.listBriefings(projectId, briefingType, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get briefing details with attendees")
    public ResponseEntity<ApiResponse<SafetyBriefingResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(briefingService.getBriefing(id)));
    }

    @PostMapping
    @Operation(summary = "Create a new briefing")
    public ResponseEntity<ApiResponse<SafetyBriefingResponse>> create(
            @Valid @RequestBody CreateSafetyBriefingRequest request) {
        SafetyBriefingResponse response = briefingService.createBriefing(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a briefing")
    public ResponseEntity<ApiResponse<SafetyBriefingResponse>> update(
            @PathVariable UUID id,
            @RequestBody UpdateSafetyBriefingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(briefingService.updateBriefing(id, request)));
    }

    @PatchMapping("/{id}/sign")
    @Operation(summary = "Sign a briefing as an attendee")
    public ResponseEntity<ApiResponse<SafetyBriefingResponse>> sign(
            @PathVariable UUID id,
            @RequestBody Map<String, UUID> body) {
        UUID employeeId = body.get("employeeId");
        return ResponseEntity.ok(ApiResponse.ok(briefingService.signBriefing(id, employeeId)));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Mark briefing as completed")
    public ResponseEntity<ApiResponse<SafetyBriefingResponse>> complete(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(briefingService.completeBriefing(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a briefing")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        briefingService.deleteBriefing(id);
        return ResponseEntity.noContent().build();
    }
}
