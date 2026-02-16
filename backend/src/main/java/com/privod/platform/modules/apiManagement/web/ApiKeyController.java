package com.privod.platform.modules.apiManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.apiManagement.service.ApiKeyService;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyCreatedResponse;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyResponse;
import com.privod.platform.modules.apiManagement.web.dto.CreateApiKeyRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "API key management endpoints")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @GetMapping
    @Operation(summary = "List active API keys")
    public ResponseEntity<ApiResponse<List<ApiKeyResponse>>> listActive() {
        List<ApiKeyResponse> keys = apiKeyService.findActiveKeys();
        return ResponseEntity.ok(ApiResponse.ok(keys));
    }

    @GetMapping("/by-user")
    @Operation(summary = "List API keys by user")
    public ResponseEntity<ApiResponse<PageResponse<ApiKeyResponse>>> listByUser(
            @RequestParam(required = false) UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ApiKeyResponse> page = apiKeyService.findByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get API key by ID")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> getById(@PathVariable UUID id) {
        ApiKeyResponse response = apiKeyService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create a new API key")
    public ResponseEntity<ApiResponse<ApiKeyCreatedResponse>> create(
            @Valid @RequestBody CreateApiKeyRequest request) {
        ApiKeyCreatedResponse response = apiKeyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Deactivate an API key")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> deactivate(@PathVariable UUID id) {
        ApiKeyResponse response = apiKeyService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete an API key")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        apiKeyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
