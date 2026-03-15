package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.auth.domain.LdapConfig;
import com.privod.platform.modules.auth.domain.SamlProvider;
import com.privod.platform.modules.auth.service.LdapConfigService;
import com.privod.platform.modules.auth.service.SamlProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN')")
@Tag(name = "SSO Configuration", description = "SAML 2.0 and LDAP/AD provider management")
public class SsoConfigController {

    private final SamlProviderService samlProviderService;
    private final LdapConfigService ldapConfigService;

    // ── SAML 2.0 ────────────────────────────────────────────────────────────

    @GetMapping("/saml")
    @Operation(summary = "List SAML providers for current organization")
    public ResponseEntity<ApiResponse<List<SamlProvider>>> listSamlProviders() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(samlProviderService.getProviders(orgId)));
    }

    @GetMapping("/saml/{id}")
    @Operation(summary = "Get SAML provider details")
    public ResponseEntity<ApiResponse<SamlProvider>> getSamlProvider(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(samlProviderService.getProvider(id)));
    }

    @PostMapping("/saml")
    @Operation(summary = "Create SAML provider")
    public ResponseEntity<ApiResponse<SamlProvider>> createSamlProvider(@Valid @RequestBody SamlProvider provider) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(samlProviderService.createProvider(orgId, provider)));
    }

    @PutMapping("/saml/{id}")
    @Operation(summary = "Update SAML provider")
    public ResponseEntity<ApiResponse<SamlProvider>> updateSamlProvider(
            @PathVariable UUID id, @Valid @RequestBody SamlProvider provider) {
        return ResponseEntity.ok(ApiResponse.ok(samlProviderService.updateProvider(id, provider)));
    }

    @DeleteMapping("/saml/{id}")
    @Operation(summary = "Delete SAML provider")
    public ResponseEntity<ApiResponse<Void>> deleteSamlProvider(@PathVariable UUID id) {
        samlProviderService.deleteProvider(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── LDAP / Active Directory ─────────────────────────────────────────────

    @GetMapping("/ldap")
    @Operation(summary = "List LDAP configurations for current organization")
    public ResponseEntity<ApiResponse<List<LdapConfig>>> listLdapConfigs() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(ldapConfigService.getConfigs(orgId)));
    }

    @GetMapping("/ldap/{id}")
    @Operation(summary = "Get LDAP configuration details")
    public ResponseEntity<ApiResponse<LdapConfig>> getLdapConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(ldapConfigService.getConfig(id)));
    }

    @PostMapping("/ldap")
    @Operation(summary = "Create LDAP configuration")
    public ResponseEntity<ApiResponse<LdapConfig>> createLdapConfig(@Valid @RequestBody LdapConfig config) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(ldapConfigService.createConfig(orgId, config)));
    }

    @PutMapping("/ldap/{id}")
    @Operation(summary = "Update LDAP configuration")
    public ResponseEntity<ApiResponse<LdapConfig>> updateLdapConfig(
            @PathVariable UUID id, @Valid @RequestBody LdapConfig config) {
        return ResponseEntity.ok(ApiResponse.ok(ldapConfigService.updateConfig(id, config)));
    }

    @DeleteMapping("/ldap/{id}")
    @Operation(summary = "Delete LDAP configuration")
    public ResponseEntity<ApiResponse<Void>> deleteLdapConfig(@PathVariable UUID id) {
        ldapConfigService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/ldap/{id}/test")
    @Operation(summary = "Test LDAP connection")
    public ResponseEntity<ApiResponse<LdapConfig>> testLdapConnection(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(ldapConfigService.testConnection(id)));
    }
}
