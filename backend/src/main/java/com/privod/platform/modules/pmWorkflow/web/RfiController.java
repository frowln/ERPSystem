package com.privod.platform.modules.pmWorkflow.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import com.privod.platform.modules.pmWorkflow.service.RfiService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeRfiStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiResponseRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseEntryDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateRfiRequest;
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
@RequestMapping("/api/pm/rfis")
@RequiredArgsConstructor
@Tag(name = "RFI", description = "Управление запросами информации (RFI)")
public class RfiController {

    private final RfiService rfiService;

    @GetMapping
    @Operation(summary = "Список RFI с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<RfiResponseDto>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) RfiStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RfiResponseDto> page = rfiService.listRfis(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить RFI по ID")
    public ResponseEntity<ApiResponse<RfiResponseDto>> getById(@PathVariable UUID id) {
        RfiResponseDto response = rfiService.getRfi(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новый RFI")
    public ResponseEntity<ApiResponse<RfiResponseDto>> create(
            @Valid @RequestBody CreateRfiRequest request) {
        RfiResponseDto response = rfiService.createRfi(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить RFI")
    public ResponseEntity<ApiResponse<RfiResponseDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRfiRequest request) {
        RfiResponseDto response = rfiService.updateRfi(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус RFI")
    public ResponseEntity<ApiResponse<RfiResponseDto>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeRfiStatusRequest request) {
        RfiResponseDto response = rfiService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить RFI (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        rfiService.deleteRfi(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== RFI Responses ========================

    @GetMapping("/{rfiId}/responses")
    @Operation(summary = "Список ответов на RFI")
    public ResponseEntity<ApiResponse<PageResponse<RfiResponseEntryDto>>> listResponses(
            @PathVariable UUID rfiId,
            @PageableDefault(size = 20, sort = "respondedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RfiResponseEntryDto> page = rfiService.listResponses(rfiId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{rfiId}/responses")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить ответ на RFI")
    public ResponseEntity<ApiResponse<RfiResponseEntryDto>> addResponse(
            @PathVariable UUID rfiId,
            @Valid @RequestBody CreateRfiResponseRequest request) {
        RfiResponseEntryDto response = rfiService.addResponse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ======================== Overdue / SLA ========================

    @GetMapping("/overdue")
    @Operation(summary = "Список просроченных RFI")
    public ResponseEntity<ApiResponse<List<RfiResponseDto>>> findOverdue(
            @RequestParam(required = false) UUID projectId) {
        List<RfiResponseDto> overdue = rfiService.findOverdueRfis(projectId);
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }
}
