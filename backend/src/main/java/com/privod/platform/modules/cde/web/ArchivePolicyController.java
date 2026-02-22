package com.privod.platform.modules.cde.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.cde.service.ArchivePolicyService;
import com.privod.platform.modules.cde.web.dto.ArchivePolicyResponse;
import com.privod.platform.modules.cde.web.dto.CreateArchivePolicyRequest;
import com.privod.platform.modules.cde.web.dto.UpdateArchivePolicyRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/cde/archive-policies")
@RequiredArgsConstructor
@Tag(name = "CDE Archive Policies", description = "Archiving & retention policies for CDE documents")
public class ArchivePolicyController {

    private final ArchivePolicyService archivePolicyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Список политик архивирования с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<ArchivePolicyResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ArchivePolicyResponse> page = archivePolicyService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить политику архивирования по ID")
    public ResponseEntity<ApiResponse<ArchivePolicyResponse>> getById(@PathVariable UUID id) {
        ArchivePolicyResponse response = archivePolicyService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать политику архивирования")
    public ResponseEntity<ApiResponse<ArchivePolicyResponse>> create(
            @Valid @RequestBody CreateArchivePolicyRequest request) {
        ArchivePolicyResponse response = archivePolicyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить политику архивирования")
    public ResponseEntity<ApiResponse<ArchivePolicyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateArchivePolicyRequest request) {
        ArchivePolicyResponse response = archivePolicyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить политику архивирования (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        archivePolicyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/run-now")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Запустить автоматическое архивирование вручную")
    public ResponseEntity<ApiResponse<RunArchiveResponse>> runNow() {
        int count = archivePolicyService.autoArchiveExpiredDocuments();
        return ResponseEntity.ok(ApiResponse.ok(new RunArchiveResponse(count)));
    }

    public record RunArchiveResponse(int archivedCount) {}
}
