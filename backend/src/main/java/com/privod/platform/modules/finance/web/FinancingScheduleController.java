package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.FinancingScheduleEntry;
import com.privod.platform.modules.finance.repository.FinancingScheduleEntryRepository;
import com.privod.platform.modules.finance.web.dto.CreateFinancingScheduleEntryRequest;
import com.privod.platform.modules.finance.web.dto.FinancingScheduleEntryResponse;
import com.privod.platform.modules.finance.web.dto.UpdateFinancingScheduleEntryRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts/{contractId}/financing-schedule")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Financing Schedule", description = "Contract financing schedule management")
public class FinancingScheduleController {

    private final FinancingScheduleEntryRepository repository;

    @GetMapping
    @Operation(summary = "List financing schedule entries for a contract")
    public ResponseEntity<ApiResponse<PageResponse<FinancingScheduleEntryResponse>>> list(
            @PathVariable UUID contractId,
            @PageableDefault(size = 50, sort = "periodDate", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<FinancingScheduleEntryResponse> page = repository
                .findByContractIdAndDeletedFalse(contractId, pageable)
                .map(FinancingScheduleEntryResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all financing schedule entries for a contract (no pagination)")
    public ResponseEntity<ApiResponse<List<FinancingScheduleEntryResponse>>> listAll(
            @PathVariable UUID contractId) {

        List<FinancingScheduleEntryResponse> entries = repository
                .findByContractIdAndDeletedFalseOrderByPeriodDateAsc(contractId)
                .stream()
                .map(FinancingScheduleEntryResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a financing schedule entry by ID")
    public ResponseEntity<ApiResponse<FinancingScheduleEntryResponse>> getById(
            @PathVariable UUID contractId,
            @PathVariable UUID id) {

        FinancingScheduleEntry entry = getOrThrow(id, contractId);
        return ResponseEntity.ok(ApiResponse.ok(FinancingScheduleEntryResponse.fromEntity(entry)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a financing schedule entry")
    public ResponseEntity<ApiResponse<FinancingScheduleEntryResponse>> create(
            @PathVariable UUID contractId,
            @Valid @RequestBody CreateFinancingScheduleEntryRequest request) {

        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        FinancingScheduleEntry entry = FinancingScheduleEntry.builder()
                .contractId(contractId)
                .periodDate(request.periodDate())
                .plannedAmount(request.plannedAmount())
                .actualAmount(request.actualAmount() != null ? request.actualAmount() : java.math.BigDecimal.ZERO)
                .description(request.description())
                .organizationId(orgId)
                .build();

        entry = repository.save(entry);
        log.info("Financing schedule entry created for contract {} on {} ({})",
                contractId, request.periodDate(), entry.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(FinancingScheduleEntryResponse.fromEntity(entry)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a financing schedule entry")
    public ResponseEntity<ApiResponse<FinancingScheduleEntryResponse>> update(
            @PathVariable UUID contractId,
            @PathVariable UUID id,
            @RequestBody UpdateFinancingScheduleEntryRequest request) {

        FinancingScheduleEntry entry = getOrThrow(id, contractId);

        if (request.periodDate() != null) entry.setPeriodDate(request.periodDate());
        if (request.plannedAmount() != null) entry.setPlannedAmount(request.plannedAmount());
        if (request.actualAmount() != null) entry.setActualAmount(request.actualAmount());
        if (request.description() != null) entry.setDescription(request.description());

        entry = repository.save(entry);
        log.info("Financing schedule entry updated: {} ({})", entry.getPeriodDate(), entry.getId());

        return ResponseEntity.ok(ApiResponse.ok(FinancingScheduleEntryResponse.fromEntity(entry)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Delete a financing schedule entry (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID contractId,
            @PathVariable UUID id) {

        FinancingScheduleEntry entry = getOrThrow(id, contractId);
        entry.softDelete();
        repository.save(entry);
        log.info("Financing schedule entry deleted: {}", id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    private FinancingScheduleEntry getOrThrow(UUID id, UUID contractId) {
        return repository.findById(id)
                .filter(e -> !e.isDeleted() && e.getContractId().equals(contractId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запись графика финансирования не найдена: " + id));
    }
}
