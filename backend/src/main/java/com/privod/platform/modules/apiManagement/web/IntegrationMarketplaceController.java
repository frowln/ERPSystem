package com.privod.platform.modules.apiManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.apiManagement.domain.ConnectorCategory;
import com.privod.platform.modules.apiManagement.service.IntegrationMarketplaceService;
import com.privod.platform.modules.apiManagement.web.dto.ConfigureConnectorRequest;
import com.privod.platform.modules.apiManagement.web.dto.ConnectorInstallationResponse;
import com.privod.platform.modules.apiManagement.web.dto.ConnectorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@Tag(name = "Integration Marketplace", description = "Integration connector marketplace endpoints")
public class IntegrationMarketplaceController {

    private final IntegrationMarketplaceService marketplaceService;

    @GetMapping("/connectors")
    @Operation(summary = "List all available connectors")
    public ResponseEntity<ApiResponse<List<ConnectorResponse>>> listConnectors(
            @RequestParam(required = false) ConnectorCategory category) {
        List<ConnectorResponse> connectors = marketplaceService.listConnectors(category);
        return ResponseEntity.ok(ApiResponse.ok(connectors));
    }

    @GetMapping("/connectors/{slug}")
    @Operation(summary = "Get connector by slug")
    public ResponseEntity<ApiResponse<ConnectorResponse>> getConnector(@PathVariable String slug) {
        ConnectorResponse response = marketplaceService.getConnector(slug);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/connectors/{connectorId}/install")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Install a connector for the current organization")
    public ResponseEntity<ApiResponse<ConnectorInstallationResponse>> installConnector(
            @PathVariable UUID connectorId) {
        ConnectorInstallationResponse response = marketplaceService.installConnector(connectorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/installations/{id}/configure")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Configure an installed connector")
    public ResponseEntity<ApiResponse<ConnectorInstallationResponse>> configureConnector(
            @PathVariable UUID id,
            @Valid @RequestBody ConfigureConnectorRequest request) {
        ConnectorInstallationResponse response = marketplaceService.configureConnector(id, request.configJson());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/installations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Uninstall a connector")
    public ResponseEntity<ApiResponse<Void>> uninstallConnector(@PathVariable UUID id) {
        marketplaceService.uninstallConnector(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/installations")
    @Operation(summary = "List installed connectors for the current organization")
    public ResponseEntity<ApiResponse<List<ConnectorInstallationResponse>>> getInstalledConnectors() {
        List<ConnectorInstallationResponse> installations = marketplaceService.getInstalledConnectors();
        return ResponseEntity.ok(ApiResponse.ok(installations));
    }

    @GetMapping("/installations/{id}")
    @Operation(summary = "Get connector installation status")
    public ResponseEntity<ApiResponse<ConnectorInstallationResponse>> getConnectorStatus(
            @PathVariable UUID id) {
        ConnectorInstallationResponse response = marketplaceService.getConnectorStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
