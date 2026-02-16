package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.ReconciliationAct;
import com.privod.platform.modules.finance.domain.ReconciliationActStatus;
import com.privod.platform.modules.finance.service.ReconciliationActService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/finance/reconciliation-acts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
@Tag(name = "Reconciliation Acts", description = "Акты сверки взаиморасчётов")
public class ReconciliationActController {

    private final ReconciliationActService actService;

    @GetMapping
    @Operation(summary = "Список актов сверки")
    public ResponseEntity<ApiResponse<PageResponse<ReconciliationAct>>> list(
            @RequestParam(required = false) ReconciliationActStatus status,
            @RequestParam(required = false) UUID counterpartyId,
            @RequestParam(required = false) UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReconciliationAct> page = actService.listActs(status, counterpartyId, contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить акт сверки по ID")
    public ResponseEntity<ApiResponse<ReconciliationAct>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(actService.getAct(id)));
    }

    @PostMapping
    @Operation(summary = "Создать акт сверки")
    public ResponseEntity<ApiResponse<ReconciliationAct>> create(@Valid @RequestBody ReconciliationAct act) {
        ReconciliationAct created = actService.createAct(act);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить акт сверки (только черновик)")
    public ResponseEntity<ApiResponse<ReconciliationAct>> update(@PathVariable UUID id,
                                                                   @Valid @RequestBody ReconciliationAct updates) {
        return ResponseEntity.ok(ApiResponse.ok(actService.updateAct(id, updates)));
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Отправить акт контрагенту")
    public ResponseEntity<ApiResponse<ReconciliationAct>> send(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(actService.sendAct(id)));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Подтвердить акт (авто-определение расхождений)")
    public ResponseEntity<ApiResponse<ReconciliationAct>> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(actService.confirmAct(id)));
    }

    @PostMapping("/{id}/sign")
    @Operation(summary = "Подписать акт сверки")
    public ResponseEntity<ApiResponse<ReconciliationAct>> sign(
            @PathVariable UUID id,
            @RequestParam boolean signedByUs,
            @RequestParam boolean signedByCounterparty) {
        return ResponseEntity.ok(ApiResponse.ok(actService.signAct(id, signedByUs, signedByCounterparty)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить акт (только черновик)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        actService.deleteAct(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
