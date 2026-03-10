package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.BankStatementService;
import com.privod.platform.modules.finance.web.dto.BankTransactionResponse;
import com.privod.platform.modules.finance.web.dto.ConfirmBankTransactionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank-statements")
@RequiredArgsConstructor
@Tag(name = "Bank Statements", description = "Bank statement upload and transaction matching")
public class BankStatementController {

    private final BankStatementService bankStatementService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Upload bank statement file and parse transactions")
    public ResponseEntity<ApiResponse<List<BankTransactionResponse>>> upload(
            @RequestParam("file") MultipartFile file) {
        List<BankTransactionResponse> transactions = bankStatementService.uploadAndParse(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(transactions));
    }

    @PostMapping("/transactions/{transactionId}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Confirm match between bank transaction and invoice")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> confirmMatch(
            @PathVariable UUID transactionId,
            @Valid @RequestBody ConfirmBankTransactionRequest request) {
        BankTransactionResponse response = bankStatementService.confirmMatch(transactionId, request.invoiceId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/transactions/{transactionId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Reject a matched bank transaction")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> rejectMatch(
            @PathVariable UUID transactionId) {
        BankTransactionResponse response = bankStatementService.rejectMatch(transactionId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
