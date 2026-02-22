package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.SkillsMatchingService;
import com.privod.platform.modules.planning.web.dto.AllocationScenarioResponse;
import com.privod.platform.modules.planning.web.dto.CandidateSuggestionResponse;
import com.privod.platform.modules.planning.web.dto.CertComplianceCheckResponse;
import com.privod.platform.modules.planning.web.dto.CreateEmployeeSkillRequest;
import com.privod.platform.modules.planning.web.dto.CreateProjectSkillRequirementRequest;
import com.privod.platform.modules.planning.web.dto.EmployeeSkillResponse;
import com.privod.platform.modules.planning.web.dto.ProjectSkillRequirementResponse;
import com.privod.platform.modules.planning.web.dto.WhatIfScenarioRequest;
import com.privod.platform.modules.planning.web.dto.WhatIfScenarioResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/planning/skills-matching")
@RequiredArgsConstructor
@Tag(name = "Skills Matching & Certification Compliance",
        description = "Подбор ресурсов по навыкам и контроль сертификации")
public class SkillsMatchingController {

    private final SkillsMatchingService skillsMatchingService;

    // ===================== Employee Skills =====================

    @PostMapping("/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить навык сотруднику")
    public ResponseEntity<ApiResponse<EmployeeSkillResponse>> addSkill(
            @Valid @RequestBody CreateEmployeeSkillRequest request) {
        EmployeeSkillResponse response = skillsMatchingService.addEmployeeSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/skills/{employeeId}")
    @Operation(summary = "Получить навыки сотрудника")
    public ResponseEntity<ApiResponse<List<EmployeeSkillResponse>>> getSkills(
            @PathVariable UUID employeeId) {
        List<EmployeeSkillResponse> skills = skillsMatchingService.getEmployeeSkills(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(skills));
    }

    @DeleteMapping("/skills/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить навык сотрудника (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> removeSkill(@PathVariable UUID skillId) {
        skillsMatchingService.removeEmployeeSkill(skillId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== Project Skill Requirements =====================

    @PostMapping("/requirements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить требование к навыку для проекта")
    public ResponseEntity<ApiResponse<ProjectSkillRequirementResponse>> addRequirement(
            @Valid @RequestBody CreateProjectSkillRequirementRequest request) {
        ProjectSkillRequirementResponse response = skillsMatchingService.addProjectRequirement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/requirements/{projectId}")
    @Operation(summary = "Получить требования к навыкам проекта")
    public ResponseEntity<ApiResponse<List<ProjectSkillRequirementResponse>>> getRequirements(
            @PathVariable UUID projectId) {
        List<ProjectSkillRequirementResponse> requirements =
                skillsMatchingService.getProjectRequirements(projectId);
        return ResponseEntity.ok(ApiResponse.ok(requirements));
    }

    @DeleteMapping("/requirements/{requirementId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить требование к навыку проекта (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> removeRequirement(@PathVariable UUID requirementId) {
        skillsMatchingService.removeProjectRequirement(requirementId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== Matching & Compliance =====================

    @GetMapping("/suggest/{projectId}")
    @Operation(summary = "Подобрать кандидатов для проекта по навыкам")
    public ResponseEntity<ApiResponse<List<CandidateSuggestionResponse>>> suggestCandidates(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "10") int maxResults) {
        List<CandidateSuggestionResponse> candidates =
                skillsMatchingService.suggestCandidates(projectId, maxResults);
        return ResponseEntity.ok(ApiResponse.ok(candidates));
    }

    @GetMapping("/compliance/{employeeId}/{projectId}")
    @Operation(summary = "Проверить соответствие сертификации сотрудника требованиям проекта")
    public ResponseEntity<ApiResponse<CertComplianceCheckResponse>> checkCompliance(
            @PathVariable UUID employeeId,
            @PathVariable UUID projectId) {
        CertComplianceCheckResponse response =
                skillsMatchingService.checkCertificationCompliance(employeeId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ===================== What-If Scenarios =====================

    @PostMapping("/scenarios")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Запустить what-if сценарий распределения ресурсов")
    public ResponseEntity<ApiResponse<WhatIfScenarioResponse>> runScenario(
            @Valid @RequestBody WhatIfScenarioRequest request) {
        WhatIfScenarioResponse response = skillsMatchingService.runWhatIfScenario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/scenarios")
    @Operation(summary = "Получить список сценариев распределения")
    public ResponseEntity<ApiResponse<PageResponse<AllocationScenarioResponse>>> listScenarios(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AllocationScenarioResponse> page = skillsMatchingService.listScenarios(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
