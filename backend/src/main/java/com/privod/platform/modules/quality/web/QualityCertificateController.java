package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.service.QualityCertificateService;
import com.privod.platform.modules.quality.web.dto.CreateQualityCertificateRequest;
import com.privod.platform.modules.quality.web.dto.QualityCertificateResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityCertificateRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quality/certificates")
@RequiredArgsConstructor
@Tag(name = "Quality Certificates", description = "Quality certificate management endpoints")
public class QualityCertificateController {

    private final QualityCertificateService certificateService;

    @GetMapping
    @Operation(summary = "List quality certificates with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<QualityCertificateResponse>>> list(
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) UUID materialId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QualityCertificateResponse> page = certificateService.listCertificates(supplierId, materialId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quality certificate by ID")
    public ResponseEntity<ApiResponse<QualityCertificateResponse>> getById(@PathVariable UUID id) {
        QualityCertificateResponse response = certificateService.getCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Create a new quality certificate")
    public ResponseEntity<ApiResponse<QualityCertificateResponse>> create(
            @Valid @RequestBody CreateQualityCertificateRequest request) {
        QualityCertificateResponse response = certificateService.createCertificate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a quality certificate")
    public ResponseEntity<ApiResponse<QualityCertificateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQualityCertificateRequest request) {
        QualityCertificateResponse response = certificateService.updateCertificate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Verify a quality certificate")
    public ResponseEntity<ApiResponse<QualityCertificateResponse>> verify(
            @PathVariable UUID id,
            @RequestParam UUID verifiedById) {
        QualityCertificateResponse response = certificateService.verifyCertificate(id, verifiedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/expired")
    @Operation(summary = "Get expired certificates")
    public ResponseEntity<ApiResponse<List<QualityCertificateResponse>>> getExpired() {
        List<QualityCertificateResponse> expired = certificateService.getExpiredCertificates();
        return ResponseEntity.ok(ApiResponse.ok(expired));
    }

    @GetMapping("/expiring")
    @Operation(summary = "Get certificates expiring within N days")
    public ResponseEntity<ApiResponse<List<QualityCertificateResponse>>> getExpiring(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<QualityCertificateResponse> expiring = certificateService.getExpiringCertificates(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(expiring));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a quality certificate")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        certificateService.deleteCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
