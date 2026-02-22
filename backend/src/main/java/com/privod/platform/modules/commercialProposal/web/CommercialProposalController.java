package com.privod.platform.modules.commercialProposal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.commercialProposal.service.CommercialProposalService;
import com.privod.platform.modules.commercialProposal.web.dto.ChangeProposalStatusRequest;
import com.privod.platform.modules.commercialProposal.web.dto.CommercialProposalItemResponse;
import com.privod.platform.modules.commercialProposal.web.dto.CommercialProposalResponse;
import com.privod.platform.modules.commercialProposal.web.dto.CreateCommercialProposalRequest;
import com.privod.platform.modules.commercialProposal.web.dto.LinkEstimateRequest;
import com.privod.platform.modules.commercialProposal.web.dto.SelectInvoiceRequest;
import com.privod.platform.modules.commercialProposal.web.dto.UpdateCommercialProposalItemRequest;
import com.privod.platform.modules.finance.service.InvoiceMatchingService;
import com.privod.platform.modules.finance.web.dto.InvoiceLineResponse;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/commercial-proposals")
@RequiredArgsConstructor
@Tag(name = "Commercial Proposals", description = "Commercial proposal (КП/Себестоимость) management endpoints")
public class CommercialProposalController {

    private final CommercialProposalService service;
    private final InvoiceMatchingService invoiceMatchingService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List commercial proposals with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<CommercialProposalResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CommercialProposalResponse> page = service.list(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get commercial proposal by ID")
    public ResponseEntity<ApiResponse<CommercialProposalResponse>> getById(@PathVariable UUID id) {
        CommercialProposalResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/matching-invoice-lines")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Find invoice lines matching a budget item for commercial proposal selection")
    public ResponseEntity<ApiResponse<List<InvoiceLineResponse>>> findMatchingInvoiceLines(
            @RequestParam UUID budgetItemId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID cpItemId,
            @RequestParam(required = false) UUID invoiceId) {
        List<InvoiceLineResponse> lines = invoiceMatchingService.findMatchingInvoiceLines(budgetItemId, projectId, cpItemId);
        if (invoiceId != null) {
            lines = lines.stream()
                    .filter(line -> invoiceId.equals(line.invoiceId()))
                    .toList();
        }
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a commercial proposal from a budget")
    public ResponseEntity<ApiResponse<CommercialProposalResponse>> create(
            @Valid @RequestBody CreateCommercialProposalRequest request) {
        CommercialProposalResponse response = service.createFromBudget(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Change commercial proposal status")
    public ResponseEntity<ApiResponse<CommercialProposalResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeProposalStatusRequest request) {
        CommercialProposalResponse response = service.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Items ───────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all items of a commercial proposal")
    public ResponseEntity<ApiResponse<List<CommercialProposalItemResponse>>> getItems(
            @PathVariable UUID id) {
        List<CommercialProposalItemResponse> items = service.getItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/{id}/items/materials")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get material items of a commercial proposal")
    public ResponseEntity<ApiResponse<List<CommercialProposalItemResponse>>> getMaterials(
            @PathVariable UUID id) {
        List<CommercialProposalItemResponse> items = service.getMaterials(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/{id}/items/works")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get work items of a commercial proposal")
    public ResponseEntity<ApiResponse<List<CommercialProposalItemResponse>>> getWorks(
            @PathVariable UUID id) {
        List<CommercialProposalItemResponse> items = service.getWorks(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PutMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a commercial proposal item")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> updateItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateCommercialProposalItemRequest request) {
        CommercialProposalItemResponse response = service.updateItem(id, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items/{itemId}/select-invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Select an invoice line for a commercial proposal item")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> selectInvoice(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @Valid @RequestBody SelectInvoiceRequest request) {
        CommercialProposalItemResponse response = service.selectInvoice(id, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items/{itemId}/link-estimate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Link an estimate item to a commercial proposal item")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> linkEstimate(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @Valid @RequestBody LinkEstimateRequest request) {
        CommercialProposalItemResponse response = service.linkEstimate(id, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items/{itemId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve a commercial proposal item")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> approveItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        CommercialProposalItemResponse response = service.approveItem(id, itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items/{itemId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Reject a commercial proposal item")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> rejectItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        CommercialProposalItemResponse response = service.rejectItem(id, itemId, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/confirm-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Confirm all approved items and sync to budget")
    public ResponseEntity<ApiResponse<CommercialProposalResponse>> confirmAll(
            @PathVariable UUID id) {
        CommercialProposalResponse response = service.confirmAll(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items/{itemId}/select-cl-entry")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Select a competitive list entry as cost price source")
    public ResponseEntity<ApiResponse<CommercialProposalItemResponse>> selectClEntry(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @RequestParam UUID clEntryId) {
        CommercialProposalItemResponse response = service.selectPriceFromCL(id, itemId, clEntryId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/push-to-fm")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Push confirmed CP items to the Financial Model (Budget)")
    public ResponseEntity<ApiResponse<CommercialProposalResponse>> pushToFm(
            @PathVariable UUID id) {
        CommercialProposalResponse response = service.pushToFinancialModel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
