package com.privod.platform.modules.payroll.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.payroll.domain.PayrollCalculationStatus;
import com.privod.platform.modules.payroll.domain.PayrollType;
import com.privod.platform.modules.payroll.service.PayrollService;
import com.privod.platform.modules.payroll.web.dto.BulkPayrollCalculateRequest;
import com.privod.platform.modules.payroll.web.dto.CreatePayrollTemplateRequest;
import com.privod.platform.modules.payroll.web.dto.PayrollCalculateRequest;
import com.privod.platform.modules.payroll.web.dto.PayrollCalculationResponse;
import com.privod.platform.modules.payroll.web.dto.PayrollTemplateResponse;
import com.privod.platform.modules.payroll.web.dto.UpdatePayrollTemplateRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Tag(name = "Payroll", description = "Payroll template and calculation management endpoints")
public class PayrollController {

    private final PayrollService payrollService;

    // ---- Root endpoint ----

    @GetMapping
    @Operation(summary = "List payroll calculations with pagination (root endpoint)")
    public ResponseEntity<ApiResponse<PageResponse<PayrollCalculationResponse>>> list(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) PayrollCalculationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PayrollCalculationResponse> page = payrollService.listCalculations(employeeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Template endpoints ----

    @GetMapping("/templates")
    @Operation(summary = "List payroll templates with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<PayrollTemplateResponse>>> listTemplates(
            @RequestParam(required = false) PayrollType type,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PayrollTemplateResponse> page = payrollService.listTemplates(type, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "Get payroll template by ID")
    public ResponseEntity<ApiResponse<PayrollTemplateResponse>> getTemplate(@PathVariable UUID id) {
        PayrollTemplateResponse response = payrollService.getTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new payroll template")
    public ResponseEntity<ApiResponse<PayrollTemplateResponse>> createTemplate(
            @Valid @RequestBody CreatePayrollTemplateRequest request) {
        PayrollTemplateResponse response = payrollService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update an existing payroll template")
    public ResponseEntity<ApiResponse<PayrollTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePayrollTemplateRequest request) {
        PayrollTemplateResponse response = payrollService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a payroll template")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        payrollService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Calculation endpoints ----

    @GetMapping("/calculations")
    @Operation(summary = "List payroll calculations with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<PayrollCalculationResponse>>> listCalculations(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) PayrollCalculationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PayrollCalculationResponse> page = payrollService.listCalculations(employeeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/calculations/{id}")
    @Operation(summary = "Get payroll calculation by ID")
    public ResponseEntity<ApiResponse<PayrollCalculationResponse>> getCalculation(@PathVariable UUID id) {
        PayrollCalculationResponse response = payrollService.getCalculation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Calculate payroll for an employee based on a template")
    public ResponseEntity<ApiResponse<PayrollCalculationResponse>> calculate(
            @Valid @RequestBody PayrollCalculateRequest request) {
        PayrollCalculationResponse response = payrollService.calculatePayroll(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/bulk-calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Bulk calculate payroll for multiple employees")
    public ResponseEntity<ApiResponse<List<PayrollCalculationResponse>>> bulkCalculate(
            @Valid @RequestBody BulkPayrollCalculateRequest request) {
        List<PayrollCalculationResponse> responses = payrollService.bulkCalculate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(responses));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve a payroll calculation")
    public ResponseEntity<ApiResponse<PayrollCalculationResponse>> approve(@PathVariable UUID id) {
        PayrollCalculationResponse response = payrollService.approveCalculation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
