package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hr.service.CrewService;
import com.privod.platform.modules.hr.web.dto.CrewAssignmentResponse;
import com.privod.platform.modules.hr.web.dto.CreateCrewAssignmentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crew")
@RequiredArgsConstructor
@Tag(name = "Crew", description = "Crew assignment management endpoints")
public class CrewController {

    private final CrewService crewService;

    @GetMapping
    @Operation(summary = "List all active crew assignments with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CrewAssignmentResponse>>> listAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<CrewAssignmentResponse> page = crewService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Assign employee to a project")
    public ResponseEntity<ApiResponse<CrewAssignmentResponse>> assign(
            @Valid @RequestBody CreateCrewAssignmentRequest request) {
        CrewAssignmentResponse response = crewService.assignToProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/employee/{employeeId}/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Remove employee from a project")
    public ResponseEntity<ApiResponse<CrewAssignmentResponse>> remove(
            @PathVariable UUID employeeId,
            @PathVariable UUID projectId) {
        CrewAssignmentResponse response = crewService.removeFromProject(employeeId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get all active crew assignments for a project")
    public ResponseEntity<ApiResponse<List<CrewAssignmentResponse>>> getProjectCrew(
            @PathVariable UUID projectId) {
        List<CrewAssignmentResponse> assignments = crewService.getProjectCrew(projectId);
        return ResponseEntity.ok(ApiResponse.ok(assignments));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get all active project assignments for an employee")
    public ResponseEntity<ApiResponse<List<CrewAssignmentResponse>>> getEmployeeProjects(
            @PathVariable UUID employeeId) {
        List<CrewAssignmentResponse> assignments = crewService.getEmployeeProjects(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(assignments));
    }
}
