package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.LimitFenceSheet;
import com.privod.platform.modules.warehouse.domain.LimitFenceSheetStatus;
import com.privod.platform.modules.warehouse.service.LimitFenceSheetService;
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

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/limit-fence-sheets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
@Tag(name = "Limit Fence Sheets", description = "Лимитно-заборные ведомости (М-8)")
public class LimitFenceSheetController {

    private final LimitFenceSheetService sheetService;

    @GetMapping
    @Operation(summary = "Список ЛЗВ с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<LimitFenceSheet>>> list(
            @RequestParam(required = false) LimitFenceSheetStatus status,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID materialId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LimitFenceSheet> page = sheetService.listSheets(status, projectId, materialId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить ЛЗВ по ID")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.getSheet(id)));
    }

    @GetMapping("/remaining-limit")
    @Operation(summary = "Остаток лимита по проекту и материалу")
    public ResponseEntity<ApiResponse<BigDecimal>> getRemainingLimit(
            @RequestParam UUID projectId, @RequestParam UUID materialId) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.getRemainingLimit(projectId, materialId)));
    }

    @PostMapping
    @Operation(summary = "Создать ЛЗВ")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> create(@Valid @RequestBody LimitFenceSheet sheet) {
        LimitFenceSheet created = sheetService.createSheet(sheet);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить ЛЗВ (только активная)")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> update(@PathVariable UUID id,
                                                                 @Valid @RequestBody LimitFenceSheet updates) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.updateSheet(id, updates)));
    }

    @PostMapping("/{id}/issue")
    @Operation(summary = "Выдача по ЛЗВ")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> issue(@PathVariable UUID id,
                                                                @RequestParam BigDecimal quantity) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.issueBySheet(id, quantity)));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "Возврат по ЛЗВ")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> returnMaterial(@PathVariable UUID id,
                                                                        @RequestParam BigDecimal quantity) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.returnBySheet(id, quantity)));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Закрыть ЛЗВ")
    public ResponseEntity<ApiResponse<LimitFenceSheet>> close(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(sheetService.closeSheet(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить ЛЗВ (без проведённых выдач)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        sheetService.deleteSheet(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
