package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.service.EmployeeService;
import com.privod.platform.modules.hr.web.dto.CertificateResponse;
import com.privod.platform.modules.hr.web.dto.CreateCertificateRequest;
import com.privod.platform.modules.hr.web.dto.CreateEmployeeRequest;
import com.privod.platform.modules.hr.web.dto.EmployeeResponse;
import com.privod.platform.modules.hr.web.dto.UpdateEmployeeRequest;
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
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Employee management endpoints")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "List employees with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID organizationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<EmployeeResponse> page = employeeService.listEmployees(search, status, organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable UUID id) {
        EmployeeResponse response = employeeService.getEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete an employee")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/by-project/{projectId}")
    @Operation(summary = "Get employees assigned to a project")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getByProject(@PathVariable UUID projectId) {
        List<EmployeeResponse> employees = employeeService.getByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(employees));
    }

    // ---- Certificates ----

    @GetMapping("/{employeeId}/certificates")
    @Operation(summary = "Get all certificates for an employee")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getCertificates(
            @PathVariable UUID employeeId) {
        List<CertificateResponse> certs = employeeService.getEmployeeCertificates(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(certs));
    }

    @PostMapping("/{employeeId}/certificates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Add a certificate to an employee")
    public ResponseEntity<ApiResponse<CertificateResponse>> addCertificate(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateCertificateRequest request) {
        CertificateResponse response = employeeService.addCertificate(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/certificates/{certificateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Delete a certificate")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(@PathVariable UUID certificateId) {
        employeeService.deleteCertificate(certificateId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/certificates/expired")
    @Operation(summary = "Get all expired certificates")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getExpiredCertificates() {
        List<CertificateResponse> certs = employeeService.getExpiredCertificates();
        return ResponseEntity.ok(ApiResponse.ok(certs));
    }

    @GetMapping("/certificates/expiring")
    @Operation(summary = "Get certificates expiring within given days")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getExpiringCertificates(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<CertificateResponse> certs = employeeService.getExpiringCertificates(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(certs));
    }
}
