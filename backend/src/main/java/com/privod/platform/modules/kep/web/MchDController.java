package com.privod.platform.modules.kep.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.kep.service.MchDService;
import com.privod.platform.modules.kep.service.MchDService.CreateMchDRequest;
import com.privod.platform.modules.kep.service.MchDService.MchDResponse;
import com.privod.platform.modules.kep.service.MchDService.UpdateMchDRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/kep/mchd")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','FINANCE_MANAGER','CONTRACT_MANAGER')")
@Tag(name = "MChD", description = "Machine-readable Power of Attorney management per 63-FZ")
public class MchDController {

    private final MchDService mchdService;

    @GetMapping
    @Operation(summary = "List MChD documents with pagination")
    public ResponseEntity<ApiResponse<PageResponse<MchDResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MchDResponse> page = mchdService.list(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get MChD document by ID")
    public ResponseEntity<ApiResponse<MchDResponse>> getById(@PathVariable UUID id) {
        MchDResponse response = mchdService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create a new MChD document")
    public ResponseEntity<ApiResponse<MchDResponse>> create(
            @Valid @RequestBody CreateMchDRequest request) {
        MchDResponse response = mchdService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing MChD document")
    public ResponseEntity<ApiResponse<MchDResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMchDRequest request) {
        MchDResponse response = mchdService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Revoke an active MChD document")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable UUID id) {
        mchdService.revoke(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an MChD document (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        mchdService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
