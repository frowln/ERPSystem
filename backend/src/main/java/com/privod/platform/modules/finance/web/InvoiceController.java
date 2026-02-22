package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.service.InvoiceService;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceLineRequest;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceRequest;
import com.privod.platform.modules.finance.web.dto.ChangeInvoiceStatusRequest;
import com.privod.platform.modules.finance.web.dto.InvoiceLineResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceSummaryResponse;
import com.privod.platform.modules.finance.web.dto.RegisterPaymentRequest;
import com.privod.platform.modules.finance.web.dto.UpdateInvoiceRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Invoice management endpoints")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "List invoices with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) InvoiceType invoiceType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<InvoiceResponse> page = invoiceService.listInvoices(projectId, status, invoiceType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get invoice by ID")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.getInvoice(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(
            @Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update an existing invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.updateInvoice(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Mark invoice as sent")
    public ResponseEntity<ApiResponse<InvoiceResponse>> send(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.sendInvoice(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Change invoice status")
    public ResponseEntity<ApiResponse<InvoiceResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeInvoiceStatusRequest request) {
        InvoiceResponse response = invoiceService.changeStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/register-payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Register a partial or full payment against an invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> registerPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RegisterPaymentRequest request) {
        InvoiceResponse response = invoiceService.registerPayment(id, request.amount());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/mark-overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Mark invoice as overdue")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markOverdue(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.markOverdue(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Cancel an invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancel(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.cancelInvoice(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get project invoice summary (totals issued/received/overdue)")
    public ResponseEntity<ApiResponse<InvoiceSummaryResponse>> getSummary(
            @RequestParam UUID projectId) {
        InvoiceSummaryResponse response = invoiceService.getProjectInvoiceSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Invoice Lines ===

    @GetMapping("/{invoiceId}/lines")
    @Operation(summary = "Get all lines of an invoice")
    public ResponseEntity<ApiResponse<List<InvoiceLineResponse>>> getLines(@PathVariable UUID invoiceId) {
        List<InvoiceLineResponse> lines = invoiceService.getInvoiceLines(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping("/{invoiceId}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Add a line to an invoice")
    public ResponseEntity<ApiResponse<InvoiceLineResponse>> addLine(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody CreateInvoiceLineRequest request) {
        InvoiceLineResponse response = invoiceService.addInvoiceLine(invoiceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{invoiceId}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete an invoice line")
    public ResponseEntity<ApiResponse<Void>> deleteLine(
            @PathVariable UUID invoiceId,
            @PathVariable UUID lineId) {
        invoiceService.deleteInvoiceLine(invoiceId, lineId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
