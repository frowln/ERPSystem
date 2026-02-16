package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.domain.AccountType;
import com.privod.platform.modules.accounting.service.AccountingService;
import com.privod.platform.modules.accounting.service.JournalService;
import com.privod.platform.modules.accounting.web.dto.AccountEntryResponse;
import com.privod.platform.modules.accounting.web.dto.AccountPeriodResponse;
import com.privod.platform.modules.accounting.web.dto.AccountPlanResponse;
import com.privod.platform.modules.accounting.web.dto.CreateAccountEntryRequest;
import com.privod.platform.modules.accounting.web.dto.DeleteAccountEntriesRequest;
import com.privod.platform.modules.accounting.web.dto.CreateFinancialJournalRequest;
import com.privod.platform.modules.accounting.web.dto.FinancialJournalResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/accounting")
@RequiredArgsConstructor
@Tag(name = "Accounting", description = "Russian accounting: chart of accounts, entries, periods")
public class AccountingController {

    private final AccountingService accountingService;
    private final JournalService journalService;

    // === Account Plan ===

    @GetMapping("/accounts")
    @Operation(summary = "List chart of accounts")
    public ResponseEntity<ApiResponse<PageResponse<AccountPlanResponse>>> listAccounts(
            @RequestParam(required = false) AccountType type,
            @PageableDefault(size = 50, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<AccountPlanResponse> page = accountingService.listAccountPlans(type, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/accounts/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<ApiResponse<AccountPlanResponse>> getAccount(@PathVariable UUID id) {
        AccountPlanResponse response = accountingService.getAccountPlan(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Financial Journals ===

    @GetMapping("/journals")
    @Operation(summary = "List financial journals")
    public ResponseEntity<ApiResponse<PageResponse<FinancialJournalResponse>>> listJournals(
            @PageableDefault(size = 50, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<FinancialJournalResponse> page = journalService.listJournals(pageable)
                .map(FinancialJournalResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/journals")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Create financial journal")
    public ResponseEntity<ApiResponse<FinancialJournalResponse>> createJournal(
            @Valid @RequestBody CreateFinancialJournalRequest request) {
        FinancialJournalResponse response = FinancialJournalResponse.fromEntity(
                journalService.createJournal(request.code(), request.name(), request.journalType()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/journals/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Activate financial journal")
    public ResponseEntity<ApiResponse<FinancialJournalResponse>> activateJournal(@PathVariable UUID id) {
        FinancialJournalResponse response = FinancialJournalResponse.fromEntity(journalService.activateJournal(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/journals/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Deactivate financial journal")
    public ResponseEntity<ApiResponse<FinancialJournalResponse>> deactivateJournal(@PathVariable UUID id) {
        FinancialJournalResponse response = FinancialJournalResponse.fromEntity(journalService.deactivateJournal(id));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Periods ===

    @GetMapping("/periods")
    @Operation(summary = "List accounting periods")
    public ResponseEntity<ApiResponse<PageResponse<AccountPeriodResponse>>> listPeriods(
            @PageableDefault(size = 20, sort = "year", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AccountPeriodResponse> page = accountingService.listPeriods(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/periods")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Open accounting period")
    public ResponseEntity<ApiResponse<Void>> openPeriod(
            @RequestParam int year,
            @RequestParam int month) {
        accountingService.openPeriod(year, month);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }

    @PostMapping("/periods/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Close accounting period")
    public ResponseEntity<ApiResponse<Void>> closePeriod(@PathVariable UUID id) {
        accountingService.closePeriod(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // === Account Entries ===

    @GetMapping("/entries")
    @Operation(summary = "List account entries")
    public ResponseEntity<ApiResponse<PageResponse<AccountEntryResponse>>> listEntries(
            @RequestParam(required = false) UUID periodId,
            @RequestParam(required = false) UUID journalId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AccountEntryResponse> page = accountingService.listEntries(periodId, journalId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/entries/{id}")
    @Operation(summary = "Get account entry by ID")
    public ResponseEntity<ApiResponse<AccountEntryResponse>> getEntry(@PathVariable UUID id) {
        AccountEntryResponse response = accountingService.getEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create account entry (provodka)")
    public ResponseEntity<ApiResponse<AccountEntryResponse>> createEntry(
            @Valid @RequestBody CreateAccountEntryRequest request) {
        AccountEntryResponse response = accountingService.createEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update account entry")
    public ResponseEntity<ApiResponse<AccountEntryResponse>> updateEntry(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAccountEntryRequest request) {
        AccountEntryResponse response = accountingService.updateEntry(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete account entry (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable UUID id) {
        accountingService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/entries/bulk-delete")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Bulk delete account entries (soft delete)")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteEntries(@Valid @RequestBody DeleteAccountEntriesRequest request) {
        accountingService.deleteEntries(request.entryIds());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
