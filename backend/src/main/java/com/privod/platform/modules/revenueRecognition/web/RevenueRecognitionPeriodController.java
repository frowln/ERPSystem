package com.privod.platform.modules.revenueRecognition.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.revenueRecognition.service.RevenueRecognitionPeriodService;
import com.privod.platform.modules.revenueRecognition.web.dto.CalculatePeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.ChangePeriodStatusRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRecognitionPeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueRecognitionPeriodResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/revenue-recognition-periods")
@RequiredArgsConstructor
@Tag(name = "Revenue Recognition Periods", description = "Period-based revenue recognition calculations")
public class RevenueRecognitionPeriodController {

    private final RevenueRecognitionPeriodService periodService;

    @GetMapping
    @Operation(summary = "List recognition periods by revenue contract")
    public ResponseEntity<ApiResponse<PageResponse<RevenueRecognitionPeriodResponse>>> list(
            @RequestParam UUID revenueContractId,
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<RevenueRecognitionPeriodResponse> page = periodService.listPeriods(
                revenueContractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get recognition period by ID")
    public ResponseEntity<ApiResponse<RevenueRecognitionPeriodResponse>> getById(
            @PathVariable UUID id) {
        RevenueRecognitionPeriodResponse response = periodService.getPeriod(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new recognition period")
    public ResponseEntity<ApiResponse<RevenueRecognitionPeriodResponse>> create(
            @Valid @RequestBody CreateRecognitionPeriodRequest request) {
        RevenueRecognitionPeriodResponse response = periodService.createPeriod(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Calculate revenue recognition for a period (ПБУ 2/2008)")
    public ResponseEntity<ApiResponse<RevenueRecognitionPeriodResponse>> calculate(
            @PathVariable UUID id,
            @Valid @RequestBody CalculatePeriodRequest request) {
        RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Change recognition period status")
    public ResponseEntity<ApiResponse<RevenueRecognitionPeriodResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePeriodStatusRequest request) {
        RevenueRecognitionPeriodResponse response = periodService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a recognition period")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        periodService.deletePeriod(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
