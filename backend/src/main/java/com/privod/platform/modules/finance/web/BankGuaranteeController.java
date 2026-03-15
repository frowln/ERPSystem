package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.BankGuarantee;
import com.privod.platform.modules.finance.domain.GuaranteeStatus;
import com.privod.platform.modules.finance.repository.BankGuaranteeRepository;
import com.privod.platform.modules.finance.web.dto.BankGuaranteeResponse;
import com.privod.platform.modules.finance.web.dto.CreateBankGuaranteeRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBankGuaranteeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/api/bank-guarantees")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Bank Guarantees", description = "Bank guarantee management")
public class BankGuaranteeController {

    private final BankGuaranteeRepository repository;

    @GetMapping
    @Operation(summary = "List bank guarantees with optional contract filter")
    public ResponseEntity<ApiResponse<PageResponse<BankGuaranteeResponse>>> list(
            @RequestParam(required = false) UUID contractId,
            @PageableDefault(size = 20, sort = "expiryDate", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<BankGuaranteeResponse> page;
        if (contractId != null) {
            page = repository.findByContractIdAndDeletedFalse(contractId, pageable)
                    .map(BankGuaranteeResponse::fromEntity);
        } else {
            page = repository.findByDeletedFalse(pageable)
                    .map(BankGuaranteeResponse::fromEntity);
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bank guarantee by ID")
    public ResponseEntity<ApiResponse<BankGuaranteeResponse>> getById(@PathVariable UUID id) {
        BankGuarantee bg = getOrThrow(id);
        return ResponseEntity.ok(ApiResponse.ok(BankGuaranteeResponse.fromEntity(bg)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new bank guarantee")
    public ResponseEntity<ApiResponse<BankGuaranteeResponse>> create(
            @Valid @RequestBody CreateBankGuaranteeRequest request) {

        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        BankGuarantee bg = BankGuarantee.builder()
                .contractId(request.contractId())
                .counterpartyId(request.counterpartyId())
                .bankName(request.bankName())
                .guaranteeNumber(request.guaranteeNumber())
                .guaranteeType(request.guaranteeType())
                .amount(request.amount())
                .currency(request.currency() != null ? request.currency() : "RUB")
                .issueDate(request.issueDate())
                .expiryDate(request.expiryDate())
                .status(GuaranteeStatus.ACTIVE)
                .documentUrl(request.documentUrl())
                .notes(request.notes())
                .organizationId(orgId)
                .build();

        bg = repository.save(bg);
        log.info("Bank guarantee created: {} ({})", bg.getGuaranteeNumber(), bg.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(BankGuaranteeResponse.fromEntity(bg)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a bank guarantee")
    public ResponseEntity<ApiResponse<BankGuaranteeResponse>> update(
            @PathVariable UUID id,
            @RequestBody UpdateBankGuaranteeRequest request) {

        BankGuarantee bg = getOrThrow(id);

        if (request.contractId() != null) bg.setContractId(request.contractId());
        if (request.counterpartyId() != null) bg.setCounterpartyId(request.counterpartyId());
        if (request.bankName() != null) bg.setBankName(request.bankName());
        if (request.guaranteeNumber() != null) bg.setGuaranteeNumber(request.guaranteeNumber());
        if (request.guaranteeType() != null) bg.setGuaranteeType(request.guaranteeType());
        if (request.amount() != null) bg.setAmount(request.amount());
        if (request.currency() != null) bg.setCurrency(request.currency());
        if (request.issueDate() != null) bg.setIssueDate(request.issueDate());
        if (request.expiryDate() != null) bg.setExpiryDate(request.expiryDate());
        if (request.status() != null) bg.setStatus(request.status());
        if (request.documentUrl() != null) bg.setDocumentUrl(request.documentUrl());
        if (request.notes() != null) bg.setNotes(request.notes());

        bg = repository.save(bg);
        log.info("Bank guarantee updated: {} ({})", bg.getGuaranteeNumber(), bg.getId());

        return ResponseEntity.ok(ApiResponse.ok(BankGuaranteeResponse.fromEntity(bg)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Delete a bank guarantee (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        BankGuarantee bg = getOrThrow(id);
        bg.softDelete();
        repository.save(bg);
        log.info("Bank guarantee deleted: {}", id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    private BankGuarantee getOrThrow(UUID id) {
        return repository.findById(id)
                .filter(bg -> !bg.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Банковская гарантия не найдена: " + id));
    }
}
