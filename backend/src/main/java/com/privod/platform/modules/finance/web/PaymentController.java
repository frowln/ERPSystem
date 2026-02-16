package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.service.PaymentService;
import com.privod.platform.modules.finance.web.dto.CreatePaymentRequest;
import com.privod.platform.modules.finance.web.dto.PaymentResponse;
import com.privod.platform.modules.finance.web.dto.PaymentSummaryResponse;
import com.privod.platform.modules.finance.web.dto.UpdatePaymentRequest;
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

import java.util.UUID;

@RestController
@RequestMapping({"/api/payments", "/api/transactions"})
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment management endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @Operation(summary = "List payments with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentType paymentType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PaymentResponse> page = paymentService.listPayments(projectId, status, paymentType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getById(@PathVariable UUID id) {
        PaymentResponse response = paymentService.getPayment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update an existing payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentRequest request) {
        PaymentResponse response = paymentService.updatePayment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve a payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> approve(@PathVariable UUID id) {
        PaymentResponse response = paymentService.approvePayment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Mark a payment as paid")
    public ResponseEntity<ApiResponse<PaymentResponse>> markPaid(@PathVariable UUID id) {
        PaymentResponse response = paymentService.markPaid(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Cancel a payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> cancel(@PathVariable UUID id) {
        PaymentResponse response = paymentService.cancelPayment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get project payment summary (totals in/out)")
    public ResponseEntity<ApiResponse<PaymentSummaryResponse>> getSummary(
            @RequestParam UUID projectId) {
        PaymentSummaryResponse response = paymentService.getProjectPaymentSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
