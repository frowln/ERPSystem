package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyCertificateService;
import com.privod.platform.modules.safety.web.dto.CreateSafetyCertificateRequest;
import com.privod.platform.modules.safety.web.dto.SafetyCertificateResponse;
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
@RequestMapping("/api/safety/certificates")
@RequiredArgsConstructor
@Tag(name = "Safety Certificates", description = "Worker certification management and matrix")
public class SafetyCertificateController {

    private final SafetyCertificateService certificateService;

    @GetMapping
    @Operation(summary = "List all certificates (matrix data)")
    public ResponseEntity<ApiResponse<PageResponse<SafetyCertificateResponse>>> listAll(
            @PageableDefault(size = 200, sort = "expiryDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<SafetyCertificateResponse> page = certificateService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/worker/{employeeId}")
    @Operation(summary = "Get all certificates for a specific worker")
    public ResponseEntity<ApiResponse<List<SafetyCertificateResponse>>> getWorkerCerts(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(certificateService.getWorkerCerts(employeeId)));
    }

    @GetMapping("/expiring")
    @Operation(summary = "Get expiring and expired certificates")
    public ResponseEntity<ApiResponse<List<SafetyCertificateResponse>>> getExpiring(
            @RequestParam(defaultValue = "90") int daysAhead) {
        return ResponseEntity.ok(ApiResponse.ok(certificateService.getExpiringCerts(daysAhead)));
    }

    @PostMapping
    @Operation(summary = "Create a new certificate")
    public ResponseEntity<ApiResponse<SafetyCertificateResponse>> create(
            @Valid @RequestBody CreateSafetyCertificateRequest request) {
        SafetyCertificateResponse response = certificateService.createCertificate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a certificate")
    public ResponseEntity<ApiResponse<SafetyCertificateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSafetyCertificateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(certificateService.updateCertificate(id, request)));
    }
}
