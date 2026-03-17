package com.privod.platform.modules.crm.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.crm.domain.LeadStatus;
import com.privod.platform.modules.crm.service.CrmService;
import com.privod.platform.modules.crm.web.dto.ConvertToProjectRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmActivityRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmLeadRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmStageRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmTeamRequest;
import com.privod.platform.modules.crm.web.dto.CrmActivityResponse;
import com.privod.platform.modules.crm.web.dto.CrmLeadResponse;
import com.privod.platform.modules.crm.web.dto.CrmPipelineResponse;
import com.privod.platform.modules.crm.web.dto.CrmStageResponse;
import com.privod.platform.modules.crm.web.dto.CrmTeamResponse;
import com.privod.platform.modules.crm.web.dto.UpdateCrmLeadRequest;
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
@RequestMapping("/api/crm")
@RequiredArgsConstructor
@Tag(name = "CRM", description = "Customer Relationship Management endpoints")
public class CrmController {

    private final CrmService crmService;

    // ===================== Opportunities (alias for leads in pipeline) =====================

    @GetMapping("/opportunities")
    @Operation(summary = "List CRM opportunities (leads in pipeline) with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<CrmLeadResponse>>> listOpportunities(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) UUID stageId,
            @RequestParam(required = false) UUID assignedToId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CrmLeadResponse> page = crmService.listLeads(search, status, stageId, assignedToId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ===================== Leads =====================

    @GetMapping("/leads")
    @Operation(summary = "List CRM leads with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<CrmLeadResponse>>> listLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) UUID stageId,
            @RequestParam(required = false) UUID assignedToId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CrmLeadResponse> page = crmService.listLeads(search, status, stageId, assignedToId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/leads/{id}")
    @Operation(summary = "Get CRM lead by ID")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> getLead(@PathVariable UUID id) {
        CrmLeadResponse response = crmService.getLead(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/leads")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Create a new CRM lead")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> createLead(
            @Valid @RequestBody CreateCrmLeadRequest request) {
        CrmLeadResponse response = crmService.createLead(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/leads/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Update a CRM lead")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCrmLeadRequest request) {
        CrmLeadResponse response = crmService.updateLead(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/leads/{id}/stage/{stageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Move lead to a different pipeline stage")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> moveToStage(
            @PathVariable UUID id,
            @PathVariable UUID stageId) {
        CrmLeadResponse response = crmService.moveToStage(id, stageId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/leads/{id}/won")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Mark lead as won")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> markAsWon(@PathVariable UUID id) {
        CrmLeadResponse response = crmService.markAsWon(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/leads/{id}/lost")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Mark lead as lost")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> markAsLost(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        CrmLeadResponse response = crmService.markAsLost(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/leads/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Convert a won lead to a project")
    public ResponseEntity<ApiResponse<CrmLeadResponse>> convertToProject(
            @PathVariable UUID id,
            @Valid @RequestBody ConvertToProjectRequest request) {
        CrmLeadResponse response = crmService.convertToProject(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/leads/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Delete a CRM lead (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID id) {
        crmService.deleteLead(id);
        return ResponseEntity.noContent().build();
    }

    // ===================== Stages =====================

    @GetMapping("/stages")
    @Operation(summary = "List all CRM pipeline stages")
    public ResponseEntity<ApiResponse<List<CrmStageResponse>>> listStages() {
        List<CrmStageResponse> stages = crmService.listStages();
        return ResponseEntity.ok(ApiResponse.ok(stages));
    }

    @PostMapping("/stages")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create a new CRM pipeline stage")
    public ResponseEntity<ApiResponse<CrmStageResponse>> createStage(
            @Valid @RequestBody CreateCrmStageRequest request) {
        CrmStageResponse response = crmService.createStage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ===================== Teams =====================

    @GetMapping("/teams")
    @Operation(summary = "List active CRM teams")
    public ResponseEntity<ApiResponse<List<CrmTeamResponse>>> listTeams() {
        List<CrmTeamResponse> teams = crmService.listTeams();
        return ResponseEntity.ok(ApiResponse.ok(teams));
    }

    @PostMapping("/teams")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create a new CRM team")
    public ResponseEntity<ApiResponse<CrmTeamResponse>> createTeam(
            @Valid @RequestBody CreateCrmTeamRequest request) {
        CrmTeamResponse response = crmService.createTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ===================== Activities =====================

    @GetMapping("/leads/{leadId}/activities")
    @Operation(summary = "Get all activities for a lead")
    public ResponseEntity<ApiResponse<List<CrmActivityResponse>>> getLeadActivities(
            @PathVariable UUID leadId) {
        List<CrmActivityResponse> activities = crmService.getLeadActivities(leadId);
        return ResponseEntity.ok(ApiResponse.ok(activities));
    }

    @PostMapping("/activities")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Create a new CRM activity")
    public ResponseEntity<ApiResponse<CrmActivityResponse>> createActivity(
            @Valid @RequestBody CreateCrmActivityRequest request) {
        CrmActivityResponse response = crmService.createActivity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/activities/{id}/complete")
    @Operation(summary = "Complete a CRM activity")
    public ResponseEntity<ApiResponse<CrmActivityResponse>> completeActivity(
            @PathVariable UUID id,
            @RequestParam(required = false) String result) {
        CrmActivityResponse response = crmService.completeActivity(id, result);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ===================== Pipeline =====================

    @GetMapping("/pipeline")
    @Operation(summary = "Get CRM pipeline statistics")
    public ResponseEntity<ApiResponse<CrmPipelineResponse>> getPipelineStats() {
        CrmPipelineResponse response = crmService.getPipelineStats();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
