package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.task.service.MilestoneService;
import com.privod.platform.modules.task.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.task.web.dto.MilestoneResponse;
import com.privod.platform.modules.task.web.dto.UpdateMilestoneRequest;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
@Tag(name = "Milestones", description = "Milestone management endpoints")
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping
    @Operation(summary = "List all milestones")
    public ResponseEntity<ApiResponse<PageResponse<MilestoneResponse>>> list(
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MilestoneResponse> page = milestoneService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get milestone by ID")
    public ResponseEntity<ApiResponse<MilestoneResponse>> getById(@PathVariable UUID id) {
        MilestoneResponse response = milestoneService.getMilestone(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new milestone")
    public ResponseEntity<ApiResponse<MilestoneResponse>> create(
            @Valid @RequestBody CreateMilestoneRequest request) {
        MilestoneResponse response = milestoneService.createMilestone(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing milestone")
    public ResponseEntity<ApiResponse<MilestoneResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMilestoneRequest request) {
        MilestoneResponse response = milestoneService.updateMilestone(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Mark milestone as completed")
    public ResponseEntity<ApiResponse<MilestoneResponse>> complete(@PathVariable UUID id) {
        MilestoneResponse response = milestoneService.completeMilestone(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get milestones for a project")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> getProjectMilestones(
            @PathVariable UUID projectId) {
        List<MilestoneResponse> milestones = milestoneService.getProjectMilestones(projectId);
        return ResponseEntity.ok(ApiResponse.ok(milestones));
    }
}
