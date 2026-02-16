package com.privod.platform.modules.priceCoefficient.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.priceCoefficient.service.PriceCoefficientService;
import com.privod.platform.modules.priceCoefficient.web.dto.CalculatePriceRequest;
import com.privod.platform.modules.priceCoefficient.web.dto.CalculatePriceResponse;
import com.privod.platform.modules.priceCoefficient.web.dto.PriceCoefficientRequest;
import com.privod.platform.modules.priceCoefficient.web.dto.PriceCoefficientResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/price-coefficients")
@RequiredArgsConstructor
@Tag(name = "Price Coefficients", description = "Price coefficient management endpoints")
public class PriceCoefficientController {

    private final PriceCoefficientService priceCoefficientService;

    @GetMapping
    @Operation(summary = "List price coefficients with pagination")
    public ResponseEntity<ApiResponse<PageResponse<PriceCoefficientResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PriceCoefficientResponse> page = priceCoefficientService.listCoefficients(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get price coefficient by ID")
    public ResponseEntity<ApiResponse<PriceCoefficientResponse>> getById(@PathVariable UUID id) {
        PriceCoefficientResponse response = priceCoefficientService.getCoefficient(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR')")
    @Operation(summary = "Create a new price coefficient")
    public ResponseEntity<ApiResponse<PriceCoefficientResponse>> create(
            @Valid @RequestBody PriceCoefficientRequest request) {
        PriceCoefficientResponse response = priceCoefficientService.createCoefficient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR')")
    @Operation(summary = "Update an existing price coefficient")
    public ResponseEntity<ApiResponse<PriceCoefficientResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PriceCoefficientRequest request) {
        PriceCoefficientResponse response = priceCoefficientService.updateCoefficient(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR')")
    @Operation(summary = "Activate a price coefficient")
    public ResponseEntity<ApiResponse<PriceCoefficientResponse>> activate(@PathVariable UUID id) {
        PriceCoefficientResponse response = priceCoefficientService.activateCoefficient(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/expire")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ESTIMATOR')")
    @Operation(summary = "Expire a price coefficient")
    public ResponseEntity<ApiResponse<PriceCoefficientResponse>> expire(@PathVariable UUID id) {
        PriceCoefficientResponse response = priceCoefficientService.expireCoefficient(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft-delete a price coefficient")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        priceCoefficientService.deleteCoefficient(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/by-contract/{contractId}")
    @Operation(summary = "Get price coefficients by contract ID")
    public ResponseEntity<ApiResponse<List<PriceCoefficientResponse>>> getByContract(
            @PathVariable UUID contractId) {
        List<PriceCoefficientResponse> response = priceCoefficientService.findByContractId(contractId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-project/{projectId}/active")
    @Operation(summary = "Get active price coefficients by project ID")
    public ResponseEntity<ApiResponse<List<PriceCoefficientResponse>>> getActiveByProject(
            @PathVariable UUID projectId) {
        List<PriceCoefficientResponse> response = priceCoefficientService.findActiveByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/calculate")
    @Operation(summary = "Calculate adjusted price using applicable coefficients")
    public ResponseEntity<ApiResponse<CalculatePriceResponse>> calculatePrice(
            @Valid @RequestBody CalculatePriceRequest request) {
        CalculatePriceResponse response = priceCoefficientService.calculateAdjustedPrice(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
