package com.privod.platform.modules.journal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.journal.domain.JournalStatus;
import com.privod.platform.modules.journal.service.GeneralJournalService;
import com.privod.platform.modules.journal.web.dto.CreateJournalEntryRequest;
import com.privod.platform.modules.journal.web.dto.CreateJournalRequest;
import com.privod.platform.modules.journal.web.dto.JournalEntryResponse;
import com.privod.platform.modules.journal.web.dto.JournalResponse;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
@Tag(name = "General Journals", description = "Управление общими журналами работ")
public class GeneralJournalController {

    private final GeneralJournalService journalService;

    @GetMapping
    @Operation(summary = "Список журналов с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<JournalResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) JournalStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<JournalResponse> page = journalService.findAll(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить журнал по ID")
    public ResponseEntity<ApiResponse<JournalResponse>> getById(@PathVariable UUID id) {
        JournalResponse response = journalService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать общий журнал работ")
    public ResponseEntity<ApiResponse<JournalResponse>> create(
            @Valid @RequestBody CreateJournalRequest request) {
        JournalResponse response = journalService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить общий журнал работ")
    public ResponseEntity<ApiResponse<JournalResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateJournalRequest request) {
        JournalResponse response = journalService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть журнал")
    public ResponseEntity<ApiResponse<JournalResponse>> close(@PathVariable UUID id) {
        JournalResponse response = journalService.closeJournal(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить журнал (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        journalService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Entry endpoints ---

    @GetMapping("/{journalId}/entries")
    @Operation(summary = "Список записей журнала")
    public ResponseEntity<ApiResponse<PageResponse<JournalEntryResponse>>> listEntries(
            @PathVariable UUID journalId,
            @PageableDefault(size = 50, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<JournalEntryResponse> page = journalService.findEntries(journalId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{journalId}/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить запись в журнал")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> addEntry(
            @PathVariable UUID journalId,
            @Valid @RequestBody CreateJournalEntryRequest request) {
        JournalEntryResponse response = journalService.addEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить запись журнала (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable UUID entryId) {
        journalService.deleteEntry(entryId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
