package com.privod.platform.modules.russianDoc.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.russianDoc.service.RussianDocService;
import com.privod.platform.modules.russianDoc.web.dto.ChangeRussianDocStatusRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateUpdRequest;
import com.privod.platform.modules.russianDoc.web.dto.UpdResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/russian-docs")
@RequiredArgsConstructor
@Tag(name = "Russian Documents", description = "Russian primary document management (UPD, TORG-12, etc.)")
public class RussianDocController {

    private final RussianDocService russianDocService;

    @GetMapping
    @Operation(summary = "List all Russian documents (UPD) with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UpdResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UpdResponse> page = russianDocService.listUpd(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ============================
    // UPD
    // ============================

    @GetMapping("/upd")
    @Operation(summary = "List UPD documents with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UpdResponse>>> listUpd(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UpdResponse> page = russianDocService.listUpd(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/upd/{id}")
    @Operation(summary = "Get UPD by ID")
    public ResponseEntity<ApiResponse<UpdResponse>> getUpd(@PathVariable UUID id) {
        UpdResponse response = russianDocService.getUpd(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/upd")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new UPD")
    public ResponseEntity<ApiResponse<UpdResponse>> createUpd(
            @Valid @RequestBody CreateUpdRequest request) {
        UpdResponse response = russianDocService.createUpd(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/upd/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Update a UPD")
    public ResponseEntity<ApiResponse<UpdResponse>> updateUpd(
            @PathVariable UUID id,
            @Valid @RequestBody CreateUpdRequest request) {
        UpdResponse response = russianDocService.updateUpd(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/upd/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Delete a UPD (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteUpd(@PathVariable UUID id) {
        russianDocService.deleteUpd(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/upd/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Change UPD status")
    public ResponseEntity<ApiResponse<UpdResponse>> changeUpdStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeRussianDocStatusRequest request) {
        UpdResponse response = russianDocService.changeUpdStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
