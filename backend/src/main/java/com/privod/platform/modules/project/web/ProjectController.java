package com.privod.platform.modules.project.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.service.ProjectFinancialService;
import com.privod.platform.modules.project.service.ProjectService;
import com.privod.platform.modules.project.web.dto.AddProjectMemberRequest;
import com.privod.platform.modules.project.web.dto.ChangeStatusRequest;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import com.privod.platform.modules.project.web.dto.ProjectDashboardResponse;
import com.privod.platform.modules.project.web.dto.ProjectFinancialSummary;
import com.privod.platform.modules.project.web.dto.ProjectMemberResponse;
import com.privod.platform.modules.project.web.dto.ProjectResponse;
import com.privod.platform.modules.project.web.dto.UpdateProjectRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Управление проектами")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectFinancialService financialService;

    @GetMapping
    @Operation(summary = "Список проектов",
               description = "Возвращает постраничный список проектов с фильтрацией по статусу, типу, приоритету, организации и городу")
    public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) ProjectType type,
            @RequestParam(required = false) ProjectPriority priority,
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID managerId,
            @RequestParam(required = false) String city,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ProjectResponse> page = projectService.findAll(
                search, status, type, priority, organizationId, managerId, city, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable UUID id) {
        ProjectResponse response = projectService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать проект",
               description = "Создаёт новый строительный проект. Доступно ролям ADMIN и PROJECT_MANAGER")
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse response = projectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing project")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request) {
        ProjectResponse response = projectService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Change project status")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        ProjectResponse response = projectService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a project (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "Get all active members of a project")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getMembers(@PathVariable UUID id) {
        List<ProjectMemberResponse> members = projectService.getMembers(id);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Add a member to a project")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddProjectMemberRequest request) {
        ProjectMemberResponse response = projectService.addMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Remove a member from a project")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID memberId) {
        projectService.removeMember(id, memberId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}/financials")
    @Operation(summary = "Get computed financial summary for a project")
    public ResponseEntity<ApiResponse<ProjectFinancialSummary>> getFinancials(@PathVariable UUID id) {
        ProjectFinancialSummary summary = financialService.getFinancials(id);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Get project dashboard summary statistics")
    public ResponseEntity<ApiResponse<ProjectDashboardResponse>> getDashboard() {
        ProjectDashboardResponse response = projectService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
