package com.privod.platform.modules.pmWorkflow.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pmWorkflow.service.PmSubmittalService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalPackageRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalReviewRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalPackageResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalReviewResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateSubmittalRequest;
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
@RequestMapping("/api/pm/submittals")
@RequiredArgsConstructor
@Tag(name = "Submittals", description = "Управление сабмиталами (передача документов на рассмотрение)")
public class PmSubmittalController {

    private final PmSubmittalService submittalService;

    @GetMapping
    @Operation(summary = "Список сабмиталов с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<SubmittalResponseDto>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) SubmittalStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SubmittalResponseDto> page = submittalService.listSubmittals(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить сабмитал по ID")
    public ResponseEntity<ApiResponse<SubmittalResponseDto>> getById(@PathVariable UUID id) {
        SubmittalResponseDto response = submittalService.getSubmittal(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новый сабмитал")
    public ResponseEntity<ApiResponse<SubmittalResponseDto>> create(
            @Valid @RequestBody CreateSubmittalRequest request) {
        SubmittalResponseDto response = submittalService.createSubmittal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить сабмитал")
    public ResponseEntity<ApiResponse<SubmittalResponseDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubmittalRequest request) {
        SubmittalResponseDto response = submittalService.updateSubmittal(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус сабмитала")
    public ResponseEntity<ApiResponse<SubmittalResponseDto>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeSubmittalStatusRequest request) {
        SubmittalResponseDto response = submittalService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить сабмитал (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        submittalService.deleteSubmittal(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Ball in Court ========================

    @GetMapping("/ball-in-court/{userId}")
    @Operation(summary = "Список сабмиталов, ожидающих действия от пользователя")
    public ResponseEntity<ApiResponse<List<SubmittalResponseDto>>> findByBallInCourt(
            @PathVariable UUID userId) {
        List<SubmittalResponseDto> result = submittalService.findByBallInCourt(userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Список просроченных сабмиталов")
    public ResponseEntity<ApiResponse<List<SubmittalResponseDto>>> findOverdue(
            @RequestParam(required = false) UUID projectId) {
        List<SubmittalResponseDto> overdue = submittalService.findOverdueSubmittals(projectId);
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }

    // ======================== Submittal Packages ========================

    @GetMapping("/packages")
    @Operation(summary = "Список пакетов сабмиталов")
    public ResponseEntity<ApiResponse<PageResponse<SubmittalPackageResponseDto>>> listPackages(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SubmittalPackageResponseDto> page = submittalService.listPackages(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать пакет сабмиталов")
    public ResponseEntity<ApiResponse<SubmittalPackageResponseDto>> createPackage(
            @Valid @RequestBody CreateSubmittalPackageRequest request) {
        SubmittalPackageResponseDto response = submittalService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/packages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить пакет сабмиталов")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable UUID id) {
        submittalService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Submittal Reviews ========================

    @GetMapping("/{submittalId}/reviews")
    @Operation(summary = "Список рецензий на сабмитал")
    public ResponseEntity<ApiResponse<PageResponse<SubmittalReviewResponseDto>>> listReviews(
            @PathVariable UUID submittalId,
            @PageableDefault(size = 20, sort = "reviewedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SubmittalReviewResponseDto> page = submittalService.listReviews(submittalId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{submittalId}/reviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить рецензию на сабмитал")
    public ResponseEntity<ApiResponse<SubmittalReviewResponseDto>> addReview(
            @PathVariable UUID submittalId,
            @Valid @RequestBody CreateSubmittalReviewRequest request) {
        SubmittalReviewResponseDto response = submittalService.addReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
