package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.service.ChecklistTemplateService;
import com.privod.platform.modules.quality.web.dto.ChecklistTemplateResponse;
import com.privod.platform.modules.quality.web.dto.CreateChecklistTemplateRequest;
import com.privod.platform.modules.quality.web.dto.UpdateChecklistTemplateRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/quality/checklist-templates")
@RequiredArgsConstructor
@Tag(name = "Checklist Templates", description = "Quality checklist template management endpoints")
public class ChecklistTemplateController {

    private final ChecklistTemplateService checklistTemplateService;

    @GetMapping
    @Operation(summary = "List checklist templates")
    public ResponseEntity<ApiResponse<PageResponse<ChecklistTemplateResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChecklistTemplateResponse> page = checklistTemplateService.list(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new checklist template")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> create(
            @Valid @RequestBody CreateChecklistTemplateRequest request) {
        ChecklistTemplateResponse response = checklistTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a checklist template")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChecklistTemplateRequest request) {
        ChecklistTemplateResponse response = checklistTemplateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
