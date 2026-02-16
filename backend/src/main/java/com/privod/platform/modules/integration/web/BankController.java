package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.service.BankIntegrationService;
import com.privod.platform.modules.integration.web.dto.BankStatementRequest;
import com.privod.platform.modules.integration.web.dto.CreatePaymentOrderRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/bank")
@RequiredArgsConstructor
@Tag(name = "Bank Integration", description = "Интеграция с банками")
public class BankController {

    private final BankIntegrationService bankIntegrationService;

    @PostMapping("/statements/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Синхронизация банковских выписок")
    public ResponseEntity<ApiResponse<SyncJobResponse>> syncStatements(
            @Valid @RequestBody BankStatementRequest request) {
        SyncJobResponse response = bankIntegrationService.syncBankStatements(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/payments/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Создать платёжное поручение")
    public ResponseEntity<ApiResponse<SyncJobResponse>> createPaymentOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request) {
        SyncJobResponse response = bankIntegrationService.createPaymentOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/payments/{syncJobId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Проверить статус платежа")
    public ResponseEntity<ApiResponse<SyncJobResponse>> checkPaymentStatus(@PathVariable UUID syncJobId) {
        SyncJobResponse response = bankIntegrationService.checkPaymentStatus(syncJobId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/reconcile/{endpointId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Сверка платежей")
    public ResponseEntity<ApiResponse<SyncJobResponse>> reconcilePayments(@PathVariable UUID endpointId) {
        SyncJobResponse response = bankIntegrationService.reconcilePayments(endpointId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
