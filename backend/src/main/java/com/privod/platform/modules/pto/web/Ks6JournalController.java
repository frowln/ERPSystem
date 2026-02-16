package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.Ks6JournalStatus;
import com.privod.platform.modules.pto.service.Ks6JournalService;
import com.privod.platform.modules.pto.web.dto.CreateKs6JournalRequest;
import com.privod.platform.modules.pto.web.dto.CreateKs6aRecordRequest;
import com.privod.platform.modules.pto.web.dto.Ks6JournalResponse;
import com.privod.platform.modules.pto.web.dto.Ks6aRecordResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/ks6-journals")
@RequiredArgsConstructor
@Tag(name = "KS-6 Journals", description = "Управление журналами КС-6 (Общий журнал работ)")
public class Ks6JournalController {

    private final Ks6JournalService ks6Service;

    @GetMapping
    @Operation(summary = "Список журналов КС-6 с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<Ks6JournalResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Ks6JournalStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Ks6JournalResponse> page = ks6Service.findAll(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить журнал КС-6 по ID")
    public ResponseEntity<ApiResponse<Ks6JournalResponse>> getById(@PathVariable UUID id) {
        Ks6JournalResponse response = ks6Service.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать журнал КС-6")
    public ResponseEntity<ApiResponse<Ks6JournalResponse>> create(
            @Valid @RequestBody CreateKs6JournalRequest request) {
        Ks6JournalResponse response = ks6Service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Активировать журнал КС-6")
    public ResponseEntity<ApiResponse<Ks6JournalResponse>> activate(@PathVariable UUID id) {
        Ks6JournalResponse response = ks6Service.activate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть журнал КС-6")
    public ResponseEntity<ApiResponse<Ks6JournalResponse>> close(@PathVariable UUID id) {
        Ks6JournalResponse response = ks6Service.close(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить журнал КС-6 (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ks6Service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- KS-6a Records ---

    @GetMapping("/{ks6JournalId}/records")
    @Operation(summary = "Список записей КС-6а для журнала")
    public ResponseEntity<ApiResponse<PageResponse<Ks6aRecordResponse>>> listRecords(
            @PathVariable UUID ks6JournalId,
            @PageableDefault(size = 50, sort = "monthYear", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Ks6aRecordResponse> page = ks6Service.findRecords(ks6JournalId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{ks6JournalId}/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить запись КС-6а")
    public ResponseEntity<ApiResponse<Ks6aRecordResponse>> addRecord(
            @PathVariable UUID ks6JournalId,
            @Valid @RequestBody CreateKs6aRecordRequest request) {
        Ks6aRecordResponse response = ks6Service.addRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/records/{recordId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить запись КС-6а (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(@PathVariable UUID recordId) {
        ks6Service.deleteRecord(recordId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
