package com.privod.platform.modules.specification.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.specification.domain.AnalogRequestStatus;
import com.privod.platform.modules.specification.service.MaterialAnalogService;
import com.privod.platform.modules.specification.web.dto.AnalogRequestResponse;
import com.privod.platform.modules.specification.web.dto.CreateAnalogRequestRequest;
import com.privod.platform.modules.specification.web.dto.CreateMaterialAnalogRequest;
import com.privod.platform.modules.specification.web.dto.MaterialAnalogResponse;
import com.privod.platform.modules.specification.web.dto.ReviewAnalogRequestRequest;
import com.privod.platform.modules.specification.web.dto.UpdateMaterialAnalogRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/specifications")
@RequiredArgsConstructor
@Tag(name = "Material Analogs", description = "Аналоги материалов и заявки на замену")
public class MaterialAnalogController {

    private final MaterialAnalogService materialAnalogService;

    // -------------------------------------------------------------------------
    // Material analogs
    // -------------------------------------------------------------------------

    @GetMapping("/analogs")
    @Operation(summary = "Список аналогов материалов")
    public ResponseEntity<ApiResponse<PageResponse<MaterialAnalogResponse>>> listAnalogs(
            @RequestParam(required = false) UUID originalMaterialId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<MaterialAnalogResponse> page = materialAnalogService.listAnalogs(originalMaterialId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/analogs/{id}")
    @Operation(summary = "Получить аналог материала по ID")
    public ResponseEntity<ApiResponse<MaterialAnalogResponse>> getAnalog(@PathVariable UUID id) {
        MaterialAnalogResponse response = materialAnalogService.getAnalog(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/analogs")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Создать аналог материала")
    public ResponseEntity<ApiResponse<MaterialAnalogResponse>> createAnalog(
            @Valid @RequestBody CreateMaterialAnalogRequest request
    ) {
        MaterialAnalogResponse response = materialAnalogService.createAnalog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/analogs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Обновить аналог материала")
    public ResponseEntity<ApiResponse<MaterialAnalogResponse>> updateAnalog(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMaterialAnalogRequest request
    ) {
        MaterialAnalogResponse response = materialAnalogService.updateAnalog(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/analogs/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Утвердить аналог материала")
    public ResponseEntity<ApiResponse<MaterialAnalogResponse>> approveAnalog(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID approvedById
    ) {
        UUID reviewerId = approvedById != null ? approvedById : SecurityUtils.requireCurrentUserId();
        MaterialAnalogResponse response = materialAnalogService.approveAnalog(id, reviewerId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/analogs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Удалить аналог материала")
    public ResponseEntity<ApiResponse<Void>> deleteAnalog(@PathVariable UUID id) {
        materialAnalogService.deleteAnalog(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // -------------------------------------------------------------------------
    // Analog requests
    // -------------------------------------------------------------------------

    @GetMapping("/analog-requests")
    @Operation(summary = "Список заявок на замену материалов")
    public ResponseEntity<ApiResponse<PageResponse<AnalogRequestResponse>>> listRequests(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) AnalogRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<AnalogRequestResponse> page = materialAnalogService.listRequests(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/analog-requests/{id}")
    @Operation(summary = "Получить заявку на замену по ID")
    public ResponseEntity<ApiResponse<AnalogRequestResponse>> getRequest(@PathVariable UUID id) {
        AnalogRequestResponse response = materialAnalogService.getRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/analog-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Создать заявку на замену материала")
    public ResponseEntity<ApiResponse<AnalogRequestResponse>> createRequest(
            @Valid @RequestBody CreateAnalogRequestRequest request
    ) {
        AnalogRequestResponse response = materialAnalogService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/analog-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Одобрить заявку на замену материала")
    public ResponseEntity<ApiResponse<AnalogRequestResponse>> approveRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveAnalogRequestPayload payload
    ) {
        UUID reviewerId = SecurityUtils.requireCurrentUserId();
        AnalogRequestResponse response = materialAnalogService.reviewRequest(
                id,
                new ReviewAnalogRequestRequest(
                        AnalogRequestStatus.APPROVED,
                        payload.selectedAnalogId(),
                        reviewerId,
                        payload.reviewComment()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/analog-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Отклонить заявку на замену материала")
    public ResponseEntity<ApiResponse<AnalogRequestResponse>> rejectRequest(
            @PathVariable UUID id,
            @Valid @RequestBody RejectAnalogRequestPayload payload
    ) {
        UUID reviewerId = SecurityUtils.requireCurrentUserId();
        AnalogRequestResponse response = materialAnalogService.reviewRequest(
                id,
                new ReviewAnalogRequestRequest(
                        AnalogRequestStatus.REJECTED,
                        null,
                        reviewerId,
                        payload.reason()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    public record ApproveAnalogRequestPayload(
            UUID selectedAnalogId,
            String reviewComment
    ) {
    }

    public record RejectAnalogRequestPayload(
            @NotNull(message = "Причина отклонения обязательна")
            String reason
    ) {
    }
}
