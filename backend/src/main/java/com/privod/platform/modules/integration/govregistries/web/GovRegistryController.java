package com.privod.platform.modules.integration.govregistries.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;
import com.privod.platform.modules.integration.govregistries.service.GovRegistryService;
import com.privod.platform.modules.integration.govregistries.web.dto.CheckResultResponse;
import com.privod.platform.modules.integration.govregistries.web.dto.CounterpartyCheckSummary;
import com.privod.platform.modules.integration.govregistries.web.dto.RegistryConfigResponse;
import com.privod.platform.modules.integration.govregistries.web.dto.UpdateRegistryConfigRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/gov-registries")
@RequiredArgsConstructor
@Tag(name = "Government Registries", description = "Интеграция с государственными реестрами")
public class GovRegistryController {

    private final GovRegistryService govRegistryService;

    // === Config ===

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список конфигураций реестров")
    public ResponseEntity<ApiResponse<List<RegistryConfigResponse>>> listConfigs() {
        List<RegistryConfigResponse> configs = govRegistryService.listConfigs();
        return ResponseEntity.ok(ApiResponse.ok(configs));
    }

    @PutMapping("/config/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию реестра")
    public ResponseEntity<ApiResponse<RegistryConfigResponse>> updateConfig(
            @PathVariable RegistryType type,
            @Valid @RequestBody UpdateRegistryConfigRequest request) {
        RegistryConfigResponse response = govRegistryService.updateConfig(type, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Checks ===

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Проверка контрагента по всем реестрам")
    public ResponseEntity<ApiResponse<CounterpartyCheckSummary>> checkCounterparty(
            @RequestParam String inn) {
        CounterpartyCheckSummary summary = govRegistryService.checkCounterparty(inn);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @PostMapping("/check/{type}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Проверка контрагента по конкретному реестру")
    public ResponseEntity<ApiResponse<CheckResultResponse>> checkByType(
            @PathVariable RegistryType type,
            @RequestParam String inn) {
        CheckResultResponse response = switch (type) {
            case EGRUL -> govRegistryService.checkEgrul(inn);
            case FNS -> govRegistryService.checkFns(inn);
            case RNPO -> govRegistryService.checkRnpo(inn);
            case EFRSB -> govRegistryService.checkBankruptcy(inn);
            case RSMP -> govRegistryService.checkSmp(inn);
        };
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Results ===

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "История проверок контрагента")
    public ResponseEntity<ApiResponse<PageResponse<CheckResultResponse>>> getCheckHistory(
            @RequestParam UUID counterpartyId,
            @PageableDefault(size = 20, sort = "checkDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CheckResultResponse> page = govRegistryService.getCheckHistory(counterpartyId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/results/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Получить результат проверки по ID")
    public ResponseEntity<ApiResponse<CheckResultResponse>> getCheckResult(@PathVariable UUID id) {
        CheckResultResponse response = govRegistryService.getCheckResult(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Recheck ===

    @PostMapping("/recheck/{counterpartyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Повторная проверка контрагента")
    public ResponseEntity<ApiResponse<CounterpartyCheckSummary>> recheckCounterparty(
            @PathVariable UUID counterpartyId) {
        CounterpartyCheckSummary summary = govRegistryService.recheckCounterparty(counterpartyId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
