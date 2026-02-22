package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.ProjectSectionService;
import com.privod.platform.modules.finance.web.dto.CreateCustomSectionRequest;
import com.privod.platform.modules.finance.web.dto.ProjectSectionResponse;
import com.privod.platform.modules.finance.web.dto.UpdateProjectSectionsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/sections")
@RequiredArgsConstructor
@Tag(name = "Project Sections", description = "Configurable project discipline sections")
public class ProjectSectionController {

    private final ProjectSectionService sectionService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List project sections")
    public ResponseEntity<ApiResponse<List<ProjectSectionResponse>>> list(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(sectionService.getSections(projectId)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Bulk toggle section visibility")
    public ResponseEntity<ApiResponse<List<ProjectSectionResponse>>> update(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectSectionsRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(sectionService.updateSections(projectId, request)));
    }

    @PostMapping("/custom")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Add a custom section")
    public ResponseEntity<ApiResponse<ProjectSectionResponse>> addCustom(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCustomSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sectionService.addCustomSection(projectId, request)));
    }

    @DeleteMapping("/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a custom section")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID sectionId) {
        sectionService.deleteCustomSection(projectId, sectionId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/seed")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Seed default sections for project")
    public ResponseEntity<ApiResponse<List<ProjectSectionResponse>>> seed(@PathVariable UUID projectId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sectionService.seedDefaultSections(projectId)));
    }
}
