package com.privod.platform.modules.integration1c.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration1c.service.Integration1cService;
import com.privod.platform.modules.integration1c.web.dto.Integration1cConfigRequest;
import com.privod.platform.modules.integration1c.web.dto.Integration1cConfigResponse;
import com.privod.platform.modules.integration1c.web.dto.Integration1cSyncLogResponse;
import com.privod.platform.modules.integration1c.web.dto.Integration1cSyncResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/1c")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN')")
@Tag(name = "1C Integration", description = "1С:Бухгалтерия integration endpoints")
public class Integration1cController {

    private final Integration1cService integration1cService;

    // ── Config ───────────────────────────────────────────────────────────

    @GetMapping("/config")
    @Operation(summary = "Get 1C integration config for current organization")
    public ResponseEntity<ApiResponse<Integration1cConfigResponse>> getConfig() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Integration1cConfigResponse config = integration1cService.getConfig(orgId);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PostMapping("/config")
    @Operation(summary = "Save or update 1C integration config")
    public ResponseEntity<ApiResponse<Integration1cConfigResponse>> saveConfig(
            @Valid @RequestBody Integration1cConfigRequest request) {
        Integration1cConfigResponse response = integration1cService.saveConfig(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Connection test ──────────────────────────────────────────────────

    @PostMapping("/test-connection")
    @Operation(summary = "Test connectivity to the configured 1C instance")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> testConnection(
            @RequestParam UUID configId) {
        Integration1cSyncResult result = integration1cService.testConnection(configId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Export endpoints ─────────────────────────────────────────────────

    @PostMapping("/export/invoices")
    @Operation(summary = "Export selected invoices to 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> exportInvoices(
            @RequestParam UUID configId,
            @RequestBody List<UUID> invoiceIds) {
        Integration1cSyncResult result = integration1cService.exportInvoices(configId, invoiceIds);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/export/ks2/{id}")
    @Operation(summary = "Export KS-2 act to 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> exportKs2(
            @RequestParam UUID configId,
            @PathVariable UUID id) {
        Integration1cSyncResult result = integration1cService.exportKs2(configId, id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/export/ks3/{id}")
    @Operation(summary = "Export KS-3 certificate to 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> exportKs3(
            @RequestParam UUID configId,
            @PathVariable UUID id) {
        Integration1cSyncResult result = integration1cService.exportKs3(configId, id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Import endpoints ─────────────────────────────────────────────────

    @PostMapping("/import/counterparties")
    @Operation(summary = "Import counterparty reference book from 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> importCounterparties(
            @RequestParam UUID configId) {
        Integration1cSyncResult result = integration1cService.importCounterparties(configId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/import/chart-of-accounts")
    @Operation(summary = "Import chart of accounts from 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> importChartOfAccounts(
            @RequestParam UUID configId) {
        Integration1cSyncResult result = integration1cService.importChartOfAccounts(configId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Sync endpoints ───────────────────────────────────────────────────

    @PostMapping("/sync/materials")
    @Operation(summary = "Bidirectional material sync with 1C")
    public ResponseEntity<ApiResponse<Integration1cSyncResult>> syncMaterials(
            @RequestParam UUID configId) {
        Integration1cSyncResult result = integration1cService.syncMaterials(configId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Sync logs ────────────────────────────────────────────────────────

    @GetMapping("/sync-logs")
    @Operation(summary = "List sync log entries for a given config")
    public ResponseEntity<ApiResponse<PageResponse<Integration1cSyncLogResponse>>> getSyncLogs(
            @RequestParam UUID configId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Integration1cSyncLogResponse> page = integration1cService.getSyncLogs(configId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
