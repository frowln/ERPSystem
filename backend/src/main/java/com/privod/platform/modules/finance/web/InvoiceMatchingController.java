package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.InvoiceMatchingEngine;
import com.privod.platform.modules.finance.web.dto.InvoiceMatchCandidate;
import com.privod.platform.modules.finance.web.dto.ThreeWayMatchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoice Matching", description = "Invoice matching and 3-way validation")
public class InvoiceMatchingController {

    private final InvoiceMatchingEngine matchingEngine;

    @GetMapping("/{invoiceId}/match")
    @Operation(summary = "Match invoice lines to budget items with fuzzy matching")
    public ResponseEntity<ApiResponse<List<InvoiceMatchCandidate>>> matchToPositions(
            @PathVariable UUID invoiceId,
            @RequestParam UUID budgetId) {
        List<InvoiceMatchCandidate> candidates = matchingEngine.matchInvoiceToPositions(invoiceId, budgetId);
        return ResponseEntity.ok(ApiResponse.ok(candidates));
    }

    @GetMapping("/{invoiceId}/three-way-match")
    @Operation(summary = "Validate 3-way match: PO/Contract vs receipt vs invoice")
    public ResponseEntity<ApiResponse<ThreeWayMatchResult>> threeWayMatch(
            @PathVariable UUID invoiceId) {
        ThreeWayMatchResult result = matchingEngine.validateThreeWayMatch(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
