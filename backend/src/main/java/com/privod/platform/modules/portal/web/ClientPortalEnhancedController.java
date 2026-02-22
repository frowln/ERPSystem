package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.service.ClientPortalService;
import com.privod.platform.modules.portal.web.dto.ClientDashboardResponse;
import com.privod.platform.modules.portal.web.dto.ClientMilestoneResponse;
import com.privod.platform.modules.portal.web.dto.CreateDocumentSignatureRequest;
import com.privod.platform.modules.portal.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.portal.web.dto.CreateProgressSnapshotRequest;
import com.privod.platform.modules.portal.web.dto.DocumentSignatureResponse;
import com.privod.platform.modules.portal.web.dto.ProgressSnapshotResponse;
import com.privod.platform.modules.portal.web.dto.RejectDocumentRequest;
import com.privod.platform.modules.portal.web.dto.SignDocumentRequest;
import com.privod.platform.modules.portal.web.dto.UpdateMilestoneRequest;
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
@RequestMapping("/api/portal/client")
@RequiredArgsConstructor
@Tag(name = "Client Portal Enhanced", description = "Расширенные функции клиентского портала")
public class ClientPortalEnhancedController {

    private final ClientPortalService clientPortalService;

    // ============================================================
    // Dashboard
    // ============================================================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Дашборд клиентского портала")
    public ResponseEntity<ApiResponse<ClientDashboardResponse>> getDashboard(
            @RequestParam UUID portalUserId,
            @RequestParam(required = false) UUID projectId) {
        ClientDashboardResponse response = clientPortalService.getClientDashboard(portalUserId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ============================================================
    // Progress Snapshots
    // ============================================================

    @GetMapping("/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Список снимков прогресса (опубликованные)")
    public ResponseEntity<ApiResponse<PageResponse<ProgressSnapshotResponse>>> getProgressSnapshots(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "snapshotDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProgressSnapshotResponse> page = clientPortalService.getPublishedSnapshots(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать снимок прогресса")
    public ResponseEntity<ApiResponse<ProgressSnapshotResponse>> createProgressSnapshot(
            @Valid @RequestBody CreateProgressSnapshotRequest request) {
        ProgressSnapshotResponse response = clientPortalService.createProgressSnapshot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/progress/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Опубликовать снимок прогресса")
    public ResponseEntity<ApiResponse<ProgressSnapshotResponse>> publishSnapshot(
            @PathVariable UUID id) {
        ProgressSnapshotResponse response = clientPortalService.publishSnapshot(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ============================================================
    // Document Signatures
    // ============================================================

    @GetMapping("/signatures")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Документы, ожидающие подписания")
    public ResponseEntity<ApiResponse<PageResponse<DocumentSignatureResponse>>> getPendingSignatures(
            @RequestParam UUID portalUserId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DocumentSignatureResponse> page = clientPortalService
                .getSignaturesForPortalUser(portalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/signatures")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Запросить подписание документа")
    public ResponseEntity<ApiResponse<DocumentSignatureResponse>> requestSignature(
            @Valid @RequestBody CreateDocumentSignatureRequest request) {
        DocumentSignatureResponse response = clientPortalService.requestSignature(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/signatures/{id}/sign")
    @PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Подписать документ")
    public ResponseEntity<ApiResponse<DocumentSignatureResponse>> signDocument(
            @PathVariable UUID id,
            @Valid @RequestBody SignDocumentRequest request) {
        DocumentSignatureResponse response = clientPortalService.signDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/signatures/{id}/reject")
    @PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Отклонить документ")
    public ResponseEntity<ApiResponse<DocumentSignatureResponse>> rejectDocument(
            @PathVariable UUID id,
            @Valid @RequestBody RejectDocumentRequest request) {
        DocumentSignatureResponse response = clientPortalService.rejectDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ============================================================
    // Milestones
    // ============================================================

    @GetMapping("/milestones")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Список вех проекта (видимые клиенту)")
    public ResponseEntity<ApiResponse<PageResponse<ClientMilestoneResponse>>> getMilestones(
            @RequestParam UUID projectId,
            @PageableDefault(size = 50, sort = "sortOrder", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ClientMilestoneResponse> page = clientPortalService.getVisibleMilestones(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/milestones")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать веху проекта")
    public ResponseEntity<ApiResponse<ClientMilestoneResponse>> createMilestone(
            @Valid @RequestBody CreateMilestoneRequest request) {
        ClientMilestoneResponse response = clientPortalService.createMilestone(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/milestones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить веху проекта")
    public ResponseEntity<ApiResponse<ClientMilestoneResponse>> updateMilestone(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMilestoneRequest request) {
        ClientMilestoneResponse response = clientPortalService.updateMilestone(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
