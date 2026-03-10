package com.privod.platform.modules.insurance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.insurance.service.InsuranceCertificateService;
import com.privod.platform.modules.insurance.web.dto.CreateInsuranceCertificateRequest;
import com.privod.platform.modules.insurance.web.dto.InsuranceCertificateResponse;
import com.privod.platform.modules.insurance.web.dto.UpdateInsuranceCertificateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/insurance-certificates")
@RequiredArgsConstructor
@Tag(name = "Insurance Certificates", description = "Insurance Certificate Tracking (COI)")
public class InsuranceCertificateController {

    private final InsuranceCertificateService service;

    @GetMapping
    @Operation(summary = "List all insurance certificates")
    public ResponseEntity<ApiResponse<PageResponse<InsuranceCertificateResponse>>> list(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<InsuranceCertificateResponse> page = service.list(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/expiring")
    @Operation(summary = "List expiring certificates")
    public ResponseEntity<ApiResponse<List<InsuranceCertificateResponse>>> getExpiring(
            @RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(ApiResponse.ok(service.getExpiring(days)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get insurance certificate by ID")
    public ResponseEntity<ApiResponse<InsuranceCertificateResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create insurance certificate")
    public ResponseEntity<ApiResponse<InsuranceCertificateResponse>> create(
            @Valid @RequestBody CreateInsuranceCertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update insurance certificate")
    public ResponseEntity<ApiResponse<InsuranceCertificateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInsuranceCertificateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete insurance certificate")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
