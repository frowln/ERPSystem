package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.domain.SignOffDecision;
import com.privod.platform.modules.closeout.domain.ZosStatus;
import com.privod.platform.modules.closeout.service.CommissioningEnhancedService;
import com.privod.platform.modules.closeout.web.dto.*;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/closeout/commissioning-enhanced")
@RequiredArgsConstructor
@Tag(name = "Commissioning Enhanced", description = "Шаблоны чек-листов, подписи, ЗОС")
public class CommissioningEnhancedController {

    private final CommissioningEnhancedService service;

    // ========== Templates ==========

    @GetMapping("/templates")
    @Operation(summary = "Список шаблонов чек-листов")
    public ResponseEntity<ApiResponse<PageResponse<CommissioningTemplateResponse>>> listTemplates(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CommissioningTemplateResponse> page = service.findAllTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "Получить шаблон по ID")
    public ResponseEntity<ApiResponse<CommissioningTemplateResponse>> getTemplate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findTemplateById(id)));
    }

    @GetMapping("/templates/system/{system}")
    @Operation(summary = "Шаблоны по системе")
    public ResponseEntity<ApiResponse<List<CommissioningTemplateResponse>>> getTemplatesBySystem(@PathVariable String system) {
        return ResponseEntity.ok(ApiResponse.ok(service.findTemplatesBySystem(system)));
    }

    @GetMapping("/templates/defaults")
    @Operation(summary = "Шаблоны по умолчанию (организация)")
    public ResponseEntity<ApiResponse<List<CommissioningTemplateResponse>>> getDefaultTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(service.findOrgDefaultTemplates()));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать шаблон")
    public ResponseEntity<ApiResponse<CommissioningTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateCommissioningTemplateRequest request) {
        CommissioningTemplateResponse response = service.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить шаблон")
    public ResponseEntity<ApiResponse<CommissioningTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommissioningTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateTemplate(id, request)));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить шаблон")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        service.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    // ========== Sign-Offs ==========

    @GetMapping("/sign-offs/{checklistId}")
    @Operation(summary = "Подписи чек-листа")
    public ResponseEntity<ApiResponse<List<CommissioningSignOffResponse>>> getSignOffs(@PathVariable UUID checklistId) {
        return ResponseEntity.ok(ApiResponse.ok(service.findSignOffs(checklistId)));
    }

    @PostMapping("/sign-offs")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить подпись")
    public ResponseEntity<ApiResponse<CommissioningSignOffResponse>> createSignOff(
            @Valid @RequestBody CreateCommissioningSignOffRequest request) {
        CommissioningSignOffResponse response = service.createSignOff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/sign-offs/{id}/decision")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить решение подписи")
    public ResponseEntity<ApiResponse<CommissioningSignOffResponse>> updateSignOff(
            @PathVariable UUID id,
            @RequestBody UpdateSignOffDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.updateSignOffDecision(id, request.decision(), request.comments())));
    }

    @DeleteMapping("/sign-offs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить подпись")
    public ResponseEntity<Void> deleteSignOff(@PathVariable UUID id) {
        service.deleteSignOff(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ZOS Documents ==========

    @GetMapping("/zos")
    @Operation(summary = "Список ЗОС документов")
    public ResponseEntity<ApiResponse<PageResponse<ZosDocumentResponse>>> listZos(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ZosDocumentResponse> page = service.findAllZos(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/zos/{id}")
    @Operation(summary = "Получить ЗОС по ID")
    public ResponseEntity<ApiResponse<ZosDocumentResponse>> getZos(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findZosById(id)));
    }

    @GetMapping("/zos/project/{projectId}")
    @Operation(summary = "ЗОС документы по проекту")
    public ResponseEntity<ApiResponse<List<ZosDocumentResponse>>> getZosByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(service.findZosByProject(projectId)));
    }

    @PostMapping("/zos")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать ЗОС")
    public ResponseEntity<ApiResponse<ZosDocumentResponse>> createZos(
            @Valid @RequestBody CreateZosDocumentRequest request) {
        ZosDocumentResponse response = service.createZos(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/zos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить ЗОС")
    public ResponseEntity<ApiResponse<ZosDocumentResponse>> updateZos(
            @PathVariable UUID id,
            @Valid @RequestBody CreateZosDocumentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateZos(id, request)));
    }

    @PutMapping("/zos/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус ЗОС")
    public ResponseEntity<ApiResponse<ZosDocumentResponse>> changeZosStatus(
            @PathVariable UUID id,
            @RequestBody ChangeZosStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.changeZosStatus(id, request.status())));
    }

    @DeleteMapping("/zos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить ЗОС")
    public ResponseEntity<Void> deleteZos(@PathVariable UUID id) {
        service.deleteZos(id);
        return ResponseEntity.noContent().build();
    }

    // Inner request records
    public record UpdateSignOffDecisionRequest(SignOffDecision decision, String comments) {}
    public record ChangeZosStatusRequest(ZosStatus status) {}
}
