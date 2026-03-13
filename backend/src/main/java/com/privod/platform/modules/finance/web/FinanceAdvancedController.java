package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.web.dto.BankExportGenerateRequest;
import com.privod.platform.modules.finance.web.dto.BankExportRecordResponse;
import com.privod.platform.modules.finance.web.dto.ExecutionChainSummaryResponse;
import com.privod.platform.modules.finance.web.dto.FactoringCalcResultResponse;
import com.privod.platform.modules.finance.web.dto.FactoringCalculateRequest;
import com.privod.platform.modules.finance.web.dto.PaymentCalendarEntryResponse;
import com.privod.platform.modules.finance.web.dto.PaymentCalendarRequest;
import com.privod.platform.modules.finance.web.dto.TaxDeadlineResponse;
import com.privod.platform.modules.finance.web.dto.TaxNotificationRequest;
import com.privod.platform.modules.finance.web.dto.TreasuryPaymentResponse;
import com.privod.platform.modules.finance.web.dto.UpdatePaymentPriorityRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Finance Advanced", description = "Advanced finance features (some endpoints are stubs)")
public class FinanceAdvancedController {

    // ========================== Factoring ==========================

    @PostMapping("/factoring/calculate")
    @Operation(summary = "Calculate factoring for selected invoices", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<List<FactoringCalcResultResponse>>> calculateFactoring(
            @Valid @RequestBody FactoringCalculateRequest request) {

        // Stub: return empty list
        List<FactoringCalcResultResponse> result = Collections.emptyList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ========================== Treasury ==========================

    @GetMapping("/treasury/payments")
    @Operation(summary = "Get treasury payments for a given month and year", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<List<TreasuryPaymentResponse>>> getTreasuryPayments(
            @RequestParam int month,
            @RequestParam int year) {

        // Stub: return empty list
        List<TreasuryPaymentResponse> result = Collections.emptyList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/treasury/payments/{id}/priority")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Update payment priority in the treasury calendar", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<Void>> updatePaymentPriority(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentPriorityRequest request) {

        // Stub: no-op
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================== Bank Export ==========================

    @PostMapping("/bank-export/generate")
    @Operation(summary = "Generate bank payment file (e.g. 1C Direct-Bank format)", description = "Stub: not yet implemented")
    public ResponseEntity<byte[]> generateBankExport(
            @Valid @RequestBody BankExportGenerateRequest request) {

        // Stub: return empty file
        byte[] emptyContent = new byte[0];
        String filename = "bank-export-" + System.currentTimeMillis() + ".txt";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(emptyContent);
    }

    @GetMapping("/bank-export/history")
    @Operation(summary = "Get bank export history", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<List<BankExportRecordResponse>>> getBankExportHistory() {

        // Stub: return empty list
        List<BankExportRecordResponse> result = Collections.emptyList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ========================== Payment Calendar ==========================

    @PostMapping("/finance/payment-calendar/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Preview payment calendar entries before generation", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<List<PaymentCalendarEntryResponse>>> previewPaymentCalendar(
            @Valid @RequestBody PaymentCalendarRequest request) {

        // Stub: return empty list
        List<PaymentCalendarEntryResponse> result = Collections.emptyList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/finance/payment-calendar/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Generate payment calendar and create planned payments", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<Void>> generatePaymentCalendar(
            @Valid @RequestBody PaymentCalendarRequest request) {

        // Stub: no-op
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================== Execution Chain ==========================

    @GetMapping("/finance/execution-chain/{projectId}")
    @Operation(summary = "Get execution chain summary (Estimate -> Budget -> KS-2 -> Invoice -> Payment)", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<ExecutionChainSummaryResponse>> getExecutionChain(
            @PathVariable UUID projectId) {

        // Stub: return object with zero values
        ExecutionChainSummaryResponse response = ExecutionChainSummaryResponse.builder()
                .projectId(projectId)
                .projectName("")
                .totalEstimate(BigDecimal.ZERO)
                .totalBudget(BigDecimal.ZERO)
                .totalKs2(BigDecimal.ZERO)
                .totalInvoiced(BigDecimal.ZERO)
                .totalPaid(BigDecimal.ZERO)
                .items(Collections.emptyList())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ========================== Tax Deadlines ==========================

    @GetMapping("/tax/deadlines")
    @Operation(summary = "Get tax deadlines and calendar", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<List<TaxDeadlineResponse>>> getTaxDeadlines() {
        // Stub: return standard Russian tax deadlines
        List<TaxDeadlineResponse> deadlines = new ArrayList<>();
        int currentYear = LocalDate.now().getYear();

        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "NDS", "НДС (ежеквартальный)",
                LocalDate.of(currentYear, 4, 25), BigDecimal.ZERO, true));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "NDS", "НДС (ежеквартальный)",
                LocalDate.of(currentYear, 7, 25), BigDecimal.ZERO, true));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "NDS", "НДС (ежеквартальный)",
                LocalDate.of(currentYear, 10, 25), BigDecimal.ZERO, true));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "PROFIT", "Налог на прибыль",
                LocalDate.of(currentYear, 3, 28), BigDecimal.ZERO, true));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "PROPERTY", "Налог на имущество",
                LocalDate.of(currentYear, 4, 1), BigDecimal.ZERO, false));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "INSURANCE", "Страховые взносы (ежемесячно)",
                LocalDate.of(currentYear, 2, 15), BigDecimal.ZERO, true));
        deadlines.add(new TaxDeadlineResponse(
                UUID.randomUUID(), "NDFL", "НДФЛ (ежемесячно)",
                LocalDate.of(currentYear, 2, 28), BigDecimal.ZERO, true));

        return ResponseEntity.ok(ApiResponse.ok(deadlines));
    }

    @PutMapping("/tax/deadlines/{taxId}/notification")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Toggle tax deadline notification", description = "Stub: not yet implemented")
    public ResponseEntity<ApiResponse<TaxDeadlineResponse>> toggleTaxNotification(
            @PathVariable UUID taxId,
            @Valid @RequestBody TaxNotificationRequest request) {

        // Stub: return the updated deadline
        TaxDeadlineResponse response = new TaxDeadlineResponse(
                taxId, "NDS", "НДС",
                LocalDate.now().plusMonths(1),
                BigDecimal.ZERO, request.enabled());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
