package com.privod.platform.modules.bidManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.bidManagement.service.BidManagementService;
import com.privod.platform.modules.bidManagement.web.dto.BidEvaluationResponse;
import com.privod.platform.modules.bidManagement.web.dto.BidInvitationResponse;
import com.privod.platform.modules.bidManagement.web.dto.BidPackageResponse;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidEvaluationRequest;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidInvitationRequest;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.bidManagement.web.dto.LevelingMatrixResponse;
import com.privod.platform.modules.bidManagement.web.dto.UpdateBidInvitationRequest;
import com.privod.platform.modules.bidManagement.web.dto.UpdateBidPackageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bid-packages")
@RequiredArgsConstructor
@Tag(name = "Bid Management", description = "Управление тендерными пакетами, приглашениями и оценкой")
public class BidManagementController {

    private final BidManagementService service;

    // ========== PACKAGES ==========

    @GetMapping
    @Operation(summary = "Список тендерных пакетов")
    public ResponseEntity<ApiResponse<List<BidPackageResponse>>> listPackages(
            @RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(service.listPackages(projectId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить тендерный пакет по ID")
    public ResponseEntity<ApiResponse<BidPackageResponse>> getPackage(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPackage(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Создать тендерный пакет")
    public ResponseEntity<ApiResponse<BidPackageResponse>> createPackage(
            @Valid @RequestBody CreateBidPackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.createPackage(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Обновить тендерный пакет")
    public ResponseEntity<ApiResponse<BidPackageResponse>> updatePackage(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBidPackageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updatePackage(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Удалить тендерный пакет (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable UUID id) {
        service.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========== INVITATIONS ==========

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Список приглашений для тендерного пакета")
    public ResponseEntity<ApiResponse<List<BidInvitationResponse>>> listInvitations(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.listInvitations(id)));
    }

    @PostMapping("/{id}/invitations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Создать приглашение подрядчика")
    public ResponseEntity<ApiResponse<BidInvitationResponse>> createInvitation(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBidInvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.createInvitation(id, request)));
    }

    @PutMapping("/{id}/invitations/{invId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Обновить приглашение подрядчика")
    public ResponseEntity<ApiResponse<BidInvitationResponse>> updateInvitation(
            @PathVariable UUID id,
            @PathVariable UUID invId,
            @Valid @RequestBody UpdateBidInvitationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateInvitation(id, invId, request)));
    }

    @DeleteMapping("/{id}/invitations/{invId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Удалить приглашение подрядчика (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> deleteInvitation(
            @PathVariable UUID id,
            @PathVariable UUID invId) {
        service.deleteInvitation(id, invId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========== EVALUATIONS ==========

    @GetMapping("/{id}/evaluations")
    @Operation(summary = "Список оценок для тендерного пакета")
    public ResponseEntity<ApiResponse<List<BidEvaluationResponse>>> listEvaluations(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.listEvaluations(id)));
    }

    @PostMapping("/{id}/evaluations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Создать оценку")
    public ResponseEntity<ApiResponse<BidEvaluationResponse>> createEvaluation(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBidEvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.createEvaluation(id, request)));
    }

    // ========== LEVELING ==========

    @GetMapping("/{id}/leveling-matrix")
    @Operation(summary = "Матрица сравнения (leveling) для тендерного пакета")
    public ResponseEntity<ApiResponse<LevelingMatrixResponse>> getLevelingMatrix(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getLevelingMatrix(id)));
    }
}
