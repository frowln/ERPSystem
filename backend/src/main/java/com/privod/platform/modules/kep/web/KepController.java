package com.privod.platform.modules.kep.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.kep.domain.KepSigningStatus;
import com.privod.platform.modules.kep.service.KepService;
import com.privod.platform.modules.kep.web.dto.CreateKepCertificateRequest;
import com.privod.platform.modules.kep.web.dto.CreateSigningRequestRequest;
import com.privod.platform.modules.kep.web.dto.KepCertificateResponse;
import com.privod.platform.modules.kep.web.dto.KepSignatureResponse;
import com.privod.platform.modules.kep.web.dto.KepSigningRequestResponse;
import com.privod.platform.modules.kep.web.dto.SignDocumentRequest;
import com.privod.platform.modules.kep.web.dto.VerifySignatureResponse;
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
@RequestMapping("/api/kep")
@RequiredArgsConstructor
@Tag(name = "KEP", description = "Qualified Electronic Signature (КЭП) management")
public class KepController {

    private final KepService kepService;

    // ===================== Certificates =====================

    @GetMapping("/certificates")
    @Operation(summary = "List KEP certificates with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<KepCertificateResponse>>> listCertificates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID ownerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<KepCertificateResponse> page = kepService.listCertificates(search, ownerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/certificates/{id}")
    @Operation(summary = "Get KEP certificate by ID")
    public ResponseEntity<ApiResponse<KepCertificateResponse>> getCertificate(@PathVariable UUID id) {
        KepCertificateResponse response = kepService.getCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/certificates/active")
    @Operation(summary = "Get active certificates for a specific owner")
    public ResponseEntity<ApiResponse<List<KepCertificateResponse>>> getActiveCertificates(
            @RequestParam UUID ownerId) {
        List<KepCertificateResponse> certs = kepService.getActiveCertificates(ownerId);
        return ResponseEntity.ok(ApiResponse.ok(certs));
    }

    @PostMapping("/certificates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Register a new KEP certificate")
    public ResponseEntity<ApiResponse<KepCertificateResponse>> createCertificate(
            @Valid @RequestBody CreateKepCertificateRequest request) {
        KepCertificateResponse response = kepService.createCertificate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/certificates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a KEP certificate")
    public ResponseEntity<ApiResponse<KepCertificateResponse>> updateCertificate(
            @PathVariable UUID id,
            @Valid @RequestBody CreateKepCertificateRequest request) {
        KepCertificateResponse response = kepService.updateCertificate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/certificates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete a KEP certificate (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(@PathVariable UUID id) {
        kepService.deleteCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/certificates/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Revoke a KEP certificate")
    public ResponseEntity<ApiResponse<KepCertificateResponse>> revokeCertificate(@PathVariable UUID id) {
        KepCertificateResponse response = kepService.revokeCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ===================== Signing =====================

    @PostMapping("/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Sign a document with KEP")
    public ResponseEntity<ApiResponse<KepSignatureResponse>> signDocument(
            @Valid @RequestBody SignDocumentRequest request) {
        KepSignatureResponse response = kepService.signDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/signatures/verify/{signatureId}")
    @Operation(summary = "Verify a KEP signature")
    public ResponseEntity<ApiResponse<VerifySignatureResponse>> verifySignature(@PathVariable UUID signatureId) {
        VerifySignatureResponse response = kepService.verifySignature(signatureId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/signatures/document")
    @Operation(summary = "Get all signatures for a document")
    public ResponseEntity<ApiResponse<List<KepSignatureResponse>>> getDocumentSignatures(
            @RequestParam String documentModel,
            @RequestParam UUID documentId) {
        List<KepSignatureResponse> signatures = kepService.getDocumentSignatures(documentModel, documentId);
        return ResponseEntity.ok(ApiResponse.ok(signatures));
    }

    // ===================== Signing Requests =====================

    @GetMapping("/signing-requests")
    @Operation(summary = "List signing requests with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<KepSigningRequestResponse>>> listSigningRequests(
            @RequestParam(required = false) UUID signerId,
            @RequestParam(required = false) KepSigningStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<KepSigningRequestResponse> page = kepService.listSigningRequests(signerId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/signing-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a signing request")
    public ResponseEntity<ApiResponse<KepSigningRequestResponse>> createSigningRequest(
            @Valid @RequestBody CreateSigningRequestRequest request) {
        KepSigningRequestResponse response = kepService.createSigningRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/signing-requests/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Complete a signing request after document is signed")
    public ResponseEntity<ApiResponse<KepSigningRequestResponse>> completeSigningRequest(
            @PathVariable UUID id,
            @RequestParam UUID signatureId) {
        KepSigningRequestResponse response = kepService.completeSigningRequest(id, signatureId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/signing-requests/{id}/reject")
    @Operation(summary = "Reject a signing request")
    public ResponseEntity<ApiResponse<KepSigningRequestResponse>> rejectSigningRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        KepSigningRequestResponse response = kepService.rejectSigningRequest(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/signing-requests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Delete a signing request (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteSigningRequest(@PathVariable UUID id) {
        kepService.deleteSigningRequest(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
