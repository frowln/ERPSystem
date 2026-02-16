package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.auth.service.OidcProviderService;
import com.privod.platform.modules.auth.web.dto.CreateOidcProviderRequest;
import com.privod.platform.modules.auth.web.dto.OidcProviderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/auth/oidc")
@RequiredArgsConstructor
@Tag(name = "OIDC Providers", description = "OpenID Connect provider management")
public class OidcProviderController {

    private final OidcProviderService oidcProviderService;

    @PostMapping("/providers")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Register an OIDC provider")
    public ResponseEntity<ApiResponse<OidcProviderResponse>> create(
            @Valid @RequestBody CreateOidcProviderRequest request) {
        OidcProviderResponse response = oidcProviderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/providers")
    @Operation(summary = "List active OIDC providers")
    public ResponseEntity<ApiResponse<List<OidcProviderResponse>>> listActive() {
        List<OidcProviderResponse> providers = oidcProviderService.getActiveProviders();
        return ResponseEntity.ok(ApiResponse.ok(providers));
    }

    @GetMapping("/providers/{code}")
    @Operation(summary = "Get an OIDC provider by code")
    public ResponseEntity<ApiResponse<OidcProviderResponse>> getProvider(@PathVariable String code) {
        OidcProviderResponse response = oidcProviderService.getProvider(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/providers/{code}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Toggle OIDC provider active status")
    public ResponseEntity<ApiResponse<OidcProviderResponse>> toggle(
            @PathVariable String code,
            @RequestParam boolean active) {
        OidcProviderResponse response = oidcProviderService.toggleActive(code, active);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/providers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete an OIDC provider")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        oidcProviderService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
