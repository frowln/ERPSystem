package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.service.CounterpartyService;
import com.privod.platform.modules.accounting.web.dto.CounterpartyResponse;
import com.privod.platform.modules.accounting.web.dto.CreateCounterpartyRequest;
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
@RequestMapping("/api/counterparties")
@RequiredArgsConstructor
@Tag(name = "Counterparties", description = "Counterparty management (Контрагенты)")
public class CounterpartyController {

    private final CounterpartyService counterpartyService;

    @GetMapping
    @Operation(summary = "List counterparties with search")
    public ResponseEntity<ApiResponse<PageResponse<CounterpartyResponse>>> list(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CounterpartyResponse> page = counterpartyService.listCounterparties(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get counterparty by ID")
    public ResponseEntity<ApiResponse<CounterpartyResponse>> getById(@PathVariable UUID id) {
        CounterpartyResponse response = counterpartyService.getCounterparty(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new counterparty")
    public ResponseEntity<ApiResponse<CounterpartyResponse>> create(
            @Valid @RequestBody CreateCounterpartyRequest request) {
        CounterpartyResponse response = counterpartyService.createCounterparty(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a counterparty")
    public ResponseEntity<ApiResponse<CounterpartyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCounterpartyRequest request) {
        CounterpartyResponse response = counterpartyService.updateCounterparty(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Deactivate a counterparty")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        counterpartyService.deactivateCounterparty(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
