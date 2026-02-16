package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.service.CommissioningChecklistService;
import com.privod.platform.modules.closeout.web.dto.CommissioningChecklistResponse;
import com.privod.platform.modules.closeout.web.dto.CreateCommissioningChecklistRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateCommissioningChecklistRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/commissioning-checklists")
@RequiredArgsConstructor
@Tag(name = "Commissioning Checklists", description = "Управление пусконаладочными чек-листами")
public class CommissioningChecklistController {

    private final CommissioningChecklistService checklistService;

    @GetMapping
    @Operation(summary = "Список пусконаладочных чек-листов с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<CommissioningChecklistResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) ChecklistStatus status,
            @RequestParam(required = false) String system,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CommissioningChecklistResponse> page = checklistService.findAll(projectId, status, system, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить чек-лист по ID")
    public ResponseEntity<ApiResponse<CommissioningChecklistResponse>> getById(@PathVariable UUID id) {
        CommissioningChecklistResponse response = checklistService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать пусконаладочный чек-лист")
    public ResponseEntity<ApiResponse<CommissioningChecklistResponse>> create(
            @Valid @RequestBody CreateCommissioningChecklistRequest request) {
        CommissioningChecklistResponse response = checklistService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить пусконаладочный чек-лист")
    public ResponseEntity<ApiResponse<CommissioningChecklistResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommissioningChecklistRequest request) {
        CommissioningChecklistResponse response = checklistService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить пусконаладочный чек-лист (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        checklistService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
