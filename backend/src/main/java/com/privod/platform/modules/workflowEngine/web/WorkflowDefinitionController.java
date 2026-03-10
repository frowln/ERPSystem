package com.privod.platform.modules.workflowEngine.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.workflowEngine.service.WorkflowDefinitionService;
import com.privod.platform.modules.workflowEngine.web.dto.AutomationExecutionResponse;
import com.privod.platform.modules.workflowEngine.web.dto.CreateWorkflowDefinitionRequest;
import com.privod.platform.modules.workflowEngine.web.dto.CreateWorkflowStepRequest;
import com.privod.platform.modules.workflowEngine.web.dto.UpdateWorkflowDefinitionRequest;
import com.privod.platform.modules.workflowEngine.web.dto.WorkflowDefinitionResponse;
import com.privod.platform.modules.workflowEngine.web.dto.WorkflowStepResponse;
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
@RequestMapping("/api/workflow-definitions")
@RequiredArgsConstructor
@Tag(name = "Workflow Definitions", description = "Управление шаблонами бизнес-процессов")
public class WorkflowDefinitionController {

    private final WorkflowDefinitionService workflowDefinitionService;

    @GetMapping
    @Operation(summary = "Список шаблонов бизнес-процессов")
    public ResponseEntity<ApiResponse<PageResponse<WorkflowDefinitionResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<WorkflowDefinitionResponse> page = workflowDefinitionService.findAll(
                search, entityType, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить шаблон бизнес-процесса по ID")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> getById(@PathVariable UUID id) {
        WorkflowDefinitionResponse response = workflowDefinitionService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать новый шаблон бизнес-процесса")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> create(
            @Valid @RequestBody CreateWorkflowDefinitionRequest request) {
        WorkflowDefinitionResponse response = workflowDefinitionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Обновить шаблон бизнес-процесса")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkflowDefinitionRequest request) {
        WorkflowDefinitionResponse response = workflowDefinitionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Активировать/деактивировать бизнес-процесс")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> toggleActive(@PathVariable UUID id) {
        WorkflowDefinitionResponse response = workflowDefinitionService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить шаблон бизнес-процесса")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        workflowDefinitionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Steps ----

    @GetMapping("/{id}/steps")
    @Operation(summary = "Получить шаги бизнес-процесса")
    public ResponseEntity<ApiResponse<List<WorkflowStepResponse>>> getSteps(@PathVariable UUID id) {
        List<WorkflowStepResponse> steps = workflowDefinitionService.getSteps(id);
        return ResponseEntity.ok(ApiResponse.ok(steps));
    }

    @PutMapping("/{id}/steps")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Заменить шаги бизнес-процесса")
    public ResponseEntity<ApiResponse<List<WorkflowStepResponse>>> replaceSteps(
            @PathVariable UUID id,
            @Valid @RequestBody List<CreateWorkflowStepRequest> steps) {
        List<WorkflowStepResponse> response = workflowDefinitionService.replaceSteps(id, steps);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Automation Executions ----

    @GetMapping("/executions")
    @Operation(summary = "Список выполнений автоматизации")
    public ResponseEntity<ApiResponse<PageResponse<AutomationExecutionResponse>>> getExecutions(
            @RequestParam(required = false) UUID ruleId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AutomationExecutionResponse> page = workflowDefinitionService.getExecutions(ruleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
