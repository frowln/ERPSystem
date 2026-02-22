package com.privod.platform.modules.compliance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.compliance.domain.SubjectRequestStatus;
import com.privod.platform.modules.compliance.service.PrivacyComplianceService;
import com.privod.platform.modules.compliance.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.compliance.web.dto.CreateDataConsentRequest;
import com.privod.platform.modules.compliance.web.dto.CreateDataSubjectRequestRequest;
import com.privod.platform.modules.compliance.web.dto.CreatePrivacyPolicyRequest;
import com.privod.platform.modules.compliance.web.dto.DataConsentResponse;
import com.privod.platform.modules.compliance.web.dto.DataSubjectRequestResponse;
import com.privod.platform.modules.compliance.web.dto.PiiAccessLogResponse;
import com.privod.platform.modules.compliance.web.dto.PrivacyPolicyResponse;
import com.privod.platform.modules.compliance.web.dto.ProcessSubjectRequestRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST API для соблюдения требований 152-ФЗ «О персональных данных».
 */
@RestController
@RequestMapping("/api/compliance/privacy")
@RequiredArgsConstructor
@Tag(name = "Privacy Compliance (152-ФЗ)",
        description = "Управление согласиями, запросами субъектов ПДн, политиками конфиденциальности")
public class PrivacyComplianceController {

    private final PrivacyComplianceService complianceService;

    // ─── Consents ────────────────────────────────────────────────────────

    @PostMapping("/consents")
    @Operation(summary = "Предоставить согласие на обработку ПДн (ст. 9 152-ФЗ)")
    public ResponseEntity<ApiResponse<DataConsentResponse>> grantConsent(
            @Valid @RequestBody CreateDataConsentRequest request) {
        DataConsentResponse response = complianceService.grantConsent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/consents/{id}/revoke")
    @Operation(summary = "Отозвать согласие на обработку ПДн (ст. 9, п. 2 152-ФЗ)")
    public ResponseEntity<ApiResponse<DataConsentResponse>> revokeConsent(
            @PathVariable UUID id) {
        DataConsentResponse response = complianceService.revokeConsent(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/consents")
    @Operation(summary = "Список согласий на обработку ПДн")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<DataConsentResponse>>> listConsents(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<DataConsentResponse> page = complianceService.listConsents(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/consents/user/{userId}")
    @Operation(summary = "Согласия конкретного пользователя")
    public ResponseEntity<ApiResponse<List<DataConsentResponse>>> getUserConsents(
            @PathVariable UUID userId) {
        List<DataConsentResponse> consents = complianceService.getUserConsents(userId);
        return ResponseEntity.ok(ApiResponse.ok(consents));
    }

    // ─── Subject Requests ────────────────────────────────────────────────

    @PostMapping("/subject-requests")
    @Operation(summary = "Создать запрос субъекта ПДн (ст. 14 152-ФЗ)")
    public ResponseEntity<ApiResponse<DataSubjectRequestResponse>> createSubjectRequest(
            @Valid @RequestBody CreateDataSubjectRequestRequest request) {
        DataSubjectRequestResponse response = complianceService.createSubjectRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/subject-requests")
    @Operation(summary = "Список запросов субъектов ПДн")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<DataSubjectRequestResponse>>> listSubjectRequests(
            @RequestParam(required = false) SubjectRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<DataSubjectRequestResponse> page = complianceService
                .listSubjectRequests(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/subject-requests/{id}")
    @Operation(summary = "Получить запрос субъекта ПДн по ID")
    public ResponseEntity<ApiResponse<DataSubjectRequestResponse>> getSubjectRequest(
            @PathVariable UUID id) {
        DataSubjectRequestResponse response = complianceService.getSubjectRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/subject-requests/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обработать запрос субъекта ПДн")
    public ResponseEntity<ApiResponse<DataSubjectRequestResponse>> processSubjectRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessSubjectRequestRequest request) {
        DataSubjectRequestResponse response = complianceService
                .processSubjectRequest(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/subject-requests/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Просроченные запросы субъектов ПДн (срок > 30 дней)")
    public ResponseEntity<ApiResponse<List<DataSubjectRequestResponse>>> getOverdueRequests() {
        List<DataSubjectRequestResponse> overdue = complianceService.getOverdueRequests();
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }

    // ─── Data Deletion ──────────────────────────────────────────────────

    @PostMapping("/data-deletion/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удаление персональных данных пользователя (ст. 21 152-ФЗ)")
    public ResponseEntity<ApiResponse<Void>> executeDataDeletion(@PathVariable UUID userId) {
        complianceService.executeDataDeletion(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Privacy Policies ────────────────────────────────────────────────

    @PostMapping("/policies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать новую политику конфиденциальности")
    public ResponseEntity<ApiResponse<PrivacyPolicyResponse>> createPolicy(
            @Valid @RequestBody CreatePrivacyPolicyRequest request) {
        PrivacyPolicyResponse response = complianceService.createPrivacyPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/policies/current")
    @Operation(summary = "Получить действующую политику конфиденциальности")
    public ResponseEntity<ApiResponse<PrivacyPolicyResponse>> getCurrentPolicy() {
        PrivacyPolicyResponse response = complianceService.getCurrentPolicy();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/policies")
    @Operation(summary = "Список всех политик конфиденциальности")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<PrivacyPolicyResponse>>> listPolicies(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<PrivacyPolicyResponse> page = complianceService.listPolicies(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ─── PII Access Log ─────────────────────────────────────────────────

    @GetMapping("/pii-access-log")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Журнал доступа к персональным данным")
    public ResponseEntity<ApiResponse<PageResponse<PiiAccessLogResponse>>> getPiiAccessLog(
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID userId,
            @PageableDefault(size = 20, sort = "accessedAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<PiiAccessLogResponse> page = complianceService
                .getPiiAccessLog(entityId, entityType, userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ─── Dashboard ──────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Панель соответствия 152-ФЗ (агрегированная статистика)")
    public ResponseEntity<ApiResponse<ComplianceDashboardResponse>> getDashboard() {
        ComplianceDashboardResponse dashboard = complianceService.getComplianceDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
