package com.privod.platform.modules.project.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.project.service.ProjectMilestoneService;
import com.privod.platform.modules.project.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.project.web.dto.MilestoneResponse;
import com.privod.platform.modules.project.web.dto.UpdateMilestoneRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
@Tag(name = "Project Milestones", description = "Milestone schedule endpoints")
public class ProjectMilestoneController {

    private final ProjectMilestoneService milestoneService;

    @GetMapping
    @Operation(summary = "List milestones for a project")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> list(@PathVariable UUID projectId) {
        List<MilestoneResponse> milestones = milestoneService.listMilestones(projectId);
        return ResponseEntity.ok(ApiResponse.ok(milestones));
    }

    @PostMapping
    @Operation(summary = "Create a milestone")
    public ResponseEntity<ApiResponse<MilestoneResponse>> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateMilestoneRequest request) {
        MilestoneResponse response = milestoneService.createMilestone(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a milestone")
    public ResponseEntity<ApiResponse<MilestoneResponse>> update(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMilestoneRequest request) {
        MilestoneResponse response = milestoneService.updateMilestone(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a milestone (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        milestoneService.deleteMilestone(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
