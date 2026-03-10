package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.service.QualityChecklistService;
import com.privod.platform.modules.quality.web.dto.ChecklistExecutionItemResponse;
import com.privod.platform.modules.quality.web.dto.CreateQualityChecklistRequest;
import com.privod.platform.modules.quality.web.dto.QualityChecklistResponse;
import com.privod.platform.modules.quality.web.dto.UpdateChecklistItemRequest;
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
@RequestMapping("/api/quality/checklists")
@RequiredArgsConstructor
@Tag(name = "Quality Checklists", description = "Quality checklist management endpoints")
public class QualityChecklistController {

    private final QualityChecklistService checklistService;

    @GetMapping
    @Operation(summary = "List quality checklists with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<QualityChecklistResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QualityChecklistResponse> page = checklistService.listChecklists(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get checklist by ID")
    public ResponseEntity<ApiResponse<QualityChecklistResponse>> getById(@PathVariable UUID id) {
        QualityChecklistResponse response = checklistService.getChecklist(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Get checklist items")
    public ResponseEntity<ApiResponse<List<ChecklistExecutionItemResponse>>> getItems(@PathVariable UUID id) {
        List<ChecklistExecutionItemResponse> items = checklistService.getChecklistItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new quality checklist")
    public ResponseEntity<ApiResponse<QualityChecklistResponse>> create(
            @Valid @RequestBody CreateQualityChecklistRequest request) {
        QualityChecklistResponse response = checklistService.createChecklist(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{checklistId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a checklist item result (pass/fail/na)")
    public ResponseEntity<ApiResponse<ChecklistExecutionItemResponse>> updateItem(
            @PathVariable UUID checklistId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateChecklistItemRequest request) {
        ChecklistExecutionItemResponse response = checklistService.updateChecklistItem(checklistId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Complete a quality checklist")
    public ResponseEntity<ApiResponse<QualityChecklistResponse>> complete(@PathVariable UUID id) {
        QualityChecklistResponse response = checklistService.completeChecklist(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a quality checklist (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        checklistService.deleteChecklist(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
