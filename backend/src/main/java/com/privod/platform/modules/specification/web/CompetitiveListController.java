package com.privod.platform.modules.specification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.specification.service.CompetitiveListService;
import com.privod.platform.modules.specification.web.dto.ChangeCompetitiveListStatusRequest;
import com.privod.platform.modules.specification.web.dto.CompetitiveListEntryResponse;
import com.privod.platform.modules.specification.web.dto.CompetitiveListResponse;
import com.privod.platform.modules.specification.web.dto.CreateCompetitiveListEntryRequest;
import com.privod.platform.modules.specification.web.dto.CreateCompetitiveListRequest;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/competitive-lists")
@RequiredArgsConstructor
@Tag(name = "Competitive Lists", description = "Управление конкурентными листами")
public class CompetitiveListController {

    private final CompetitiveListService competitiveListService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Список конкурентных листов (по проекту или все)")
    public ResponseEntity<ApiResponse<PageResponse<CompetitiveListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CompetitiveListResponse> page = competitiveListService.list(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Получить конкурентный лист по ID")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> getById(@PathVariable UUID id) {
        CompetitiveListResponse response = competitiveListService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/from-purchase-request")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Создать конкурентный лист из заявки на закупку")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> createFromPurchaseRequest(
            @RequestParam UUID purchaseRequestId) {
        CompetitiveListResponse response = competitiveListService.createFromPurchaseRequest(purchaseRequestId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Создать конкурентный лист")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> create(
            @Valid @RequestBody CreateCompetitiveListRequest request) {
        CompetitiveListResponse response = competitiveListService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Обновить конкурентный лист")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> update(
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String notes) {
        CompetitiveListResponse response = competitiveListService.update(id, name, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Изменить статус конкурентного листа")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeCompetitiveListStatusRequest request) {
        CompetitiveListResponse response = competitiveListService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/entries")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Получить записи конкурентного листа")
    public ResponseEntity<ApiResponse<List<CompetitiveListEntryResponse>>> getEntries(
            @PathVariable UUID id) {
        List<CompetitiveListEntryResponse> entries = competitiveListService.getEntries(id);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @PostMapping("/{id}/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Добавить запись в конкурентный лист")
    public ResponseEntity<ApiResponse<CompetitiveListEntryResponse>> addEntry(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCompetitiveListEntryRequest request) {
        CompetitiveListEntryResponse response = competitiveListService.addEntry(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Обновить запись конкурентного листа")
    public ResponseEntity<ApiResponse<CompetitiveListEntryResponse>> updateEntry(
            @PathVariable UUID id,
            @PathVariable UUID entryId,
            @Valid @RequestBody CreateCompetitiveListEntryRequest request) {
        CompetitiveListEntryResponse response = competitiveListService.updateEntry(id, entryId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Удалить запись конкурентного листа")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable UUID id,
            @PathVariable UUID entryId) {
        competitiveListService.deleteEntry(id, entryId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/entries/{entryId}/select")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Выбрать победителя по позиции")
    public ResponseEntity<ApiResponse<CompetitiveListEntryResponse>> selectWinner(
            @PathVariable UUID id,
            @PathVariable UUID entryId,
            @RequestParam(required = false) String selectionReason) {
        CompetitiveListEntryResponse response = competitiveListService.selectWinner(id, entryId, selectionReason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/summary")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Сводка: лучшие цены по каждой позиции")
    public ResponseEntity<ApiResponse<Map<UUID, CompetitiveListEntryResponse>>> getSummary(
            @PathVariable UUID id) {
        Map<UUID, CompetitiveListEntryResponse> summary = competitiveListService.getSummary(id);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @PostMapping("/{id}/auto-rank")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Авторанжирование записей по весовым критериям")
    public ResponseEntity<ApiResponse<List<CompetitiveListEntryResponse>>> autoRank(
            @PathVariable UUID id) {
        List<CompetitiveListEntryResponse> entries = competitiveListService.autoRankEntries(id);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @PostMapping("/{id}/auto-select-best")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Автовыбор лучших цен по всем позициям")
    public ResponseEntity<ApiResponse<CompetitiveListResponse>> autoSelectBest(
            @PathVariable UUID id) {
        CompetitiveListResponse response = competitiveListService.autoSelectBestPrices(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/apply-to-cp/{cpId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Применить цены победителей к коммерческому предложению")
    public ResponseEntity<ApiResponse<Void>> applyToCp(
            @PathVariable UUID id,
            @PathVariable UUID cpId) {
        competitiveListService.applyToCp(id, cpId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
