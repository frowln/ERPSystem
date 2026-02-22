package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.domain.ClaimPriority;
import com.privod.platform.modules.portal.domain.ClaimStatus;
import com.privod.platform.modules.portal.service.ClientClaimService;
import com.privod.platform.modules.portal.web.dto.AddClaimCommentRequest;
import com.privod.platform.modules.portal.web.dto.AssignClaimRequest;
import com.privod.platform.modules.portal.web.dto.ClaimFeedbackRequest;
import com.privod.platform.modules.portal.web.dto.ClaimsDashboardResponse;
import com.privod.platform.modules.portal.web.dto.ClientClaimDetailResponse;
import com.privod.platform.modules.portal.web.dto.ClientClaimResponse;
import com.privod.platform.modules.portal.web.dto.CreateClientClaimRequest;
import com.privod.platform.modules.portal.web.dto.ResolveClaimRequest;
import com.privod.platform.modules.portal.web.dto.TriageClaimRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/portal/claims")
@RequiredArgsConstructor
@Tag(name = "Client Claims Management", description = "Управление клиентскими заявками")
public class ClientClaimController {

    private final ClientClaimService claimService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR')")
    @Operation(summary = "Создать клиентскую заявку")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> create(
            @Valid @RequestBody CreateClientClaimRequest request) {
        ClientClaimResponse response = claimService.createClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить заявку по ID с историей действий")
    public ResponseEntity<ApiResponse<ClientClaimDetailResponse>> getById(@PathVariable UUID id) {
        ClientClaimDetailResponse response = claimService.getClaim(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "Список заявок с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<ClientClaimResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) ClaimPriority priority,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClientClaimResponse> page = claimService.listClaims(projectId, status, priority, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PutMapping("/{id}/triage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Рассмотреть заявку (триаж)")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> triage(
            @PathVariable UUID id,
            @Valid @RequestBody TriageClaimRequest request) {
        ClientClaimResponse response = claimService.triageClaim(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Назначить подрядчика")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> assign(
            @PathVariable UUID id,
            @Valid @RequestBody AssignClaimRequest request) {
        ClientClaimResponse response = claimService.assignClaim(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/start-work")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Начать работу по заявке")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> startWork(@PathVariable UUID id) {
        ClientClaimResponse response = claimService.startWork(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Предложить решение по заявке")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveClaimRequest request) {
        ClientClaimResponse response = claimService.submitResolution(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/feedback")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PORTAL_CUSTOMER')")
    @Operation(summary = "Принять/отклонить решение (обратная связь)")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> feedback(
            @PathVariable UUID id,
            @Valid @RequestBody ClaimFeedbackRequest request) {
        ClientClaimResponse response = claimService.acceptResolution(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отклонить заявку")
    public ResponseEntity<ApiResponse<ClientClaimResponse>> reject(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        ClientClaimResponse response = claimService.rejectClaim(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR')")
    @Operation(summary = "Добавить комментарий к заявке")
    public ResponseEntity<ApiResponse<Void>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody AddClaimCommentRequest request) {
        claimService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Дашборд клиентских заявок")
    public ResponseEntity<ApiResponse<ClaimsDashboardResponse>> dashboard(
            @RequestParam(required = false) UUID projectId) {
        ClaimsDashboardResponse response = claimService.getDashboard(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my-claims")
    @PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
    @Operation(summary = "Мои заявки (для портального пользователя)")
    public ResponseEntity<ApiResponse<List<ClientClaimResponse>>> myClaims(
            @RequestParam UUID portalUserId) {
        List<ClientClaimResponse> response = claimService.getClaimsForPortalUser(portalUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
