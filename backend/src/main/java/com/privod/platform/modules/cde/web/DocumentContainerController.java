package com.privod.platform.modules.cde.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import com.privod.platform.modules.cde.service.DocumentAuditService;
import com.privod.platform.modules.cde.service.DocumentContainerService;
import com.privod.platform.modules.cde.web.dto.ChangeLifecycleStateRequest;
import com.privod.platform.modules.cde.web.dto.CreateDocumentContainerRequest;
import com.privod.platform.modules.cde.web.dto.CreateRevisionRequest;
import com.privod.platform.modules.cde.web.dto.DocumentAuditEntryResponse;
import com.privod.platform.modules.cde.web.dto.DocumentContainerResponse;
import com.privod.platform.modules.cde.web.dto.DocumentRevisionResponse;
import com.privod.platform.modules.cde.web.dto.UpdateDocumentContainerRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cde/documents")
@RequiredArgsConstructor
@Tag(name = "CDE Documents", description = "ISO 19650 Common Data Environment - Document management")
public class DocumentContainerController {

    private final DocumentContainerService documentContainerService;
    private final DocumentAuditService documentAuditService;

    @GetMapping
    @Operation(summary = "Список документов с фильтрацией и пагинацией (все документы или по проекту)")
    public ResponseEntity<ApiResponse<PageResponse<DocumentContainerResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) DocumentLifecycleState state,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<DocumentContainerResponse> page;
        if (projectId != null) {
            page = documentContainerService.findByProject(projectId, search, state, pageable);
        } else {
            page = documentContainerService.findAll(search, state, pageable);
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить документ по ID")
    public ResponseEntity<ApiResponse<DocumentContainerResponse>> getById(@PathVariable UUID id) {
        DocumentContainerResponse response = documentContainerService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать контейнер документа")
    public ResponseEntity<ApiResponse<DocumentContainerResponse>> create(
            @Valid @RequestBody CreateDocumentContainerRequest request) {
        DocumentContainerResponse response = documentContainerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить контейнер документа")
    public ResponseEntity<ApiResponse<DocumentContainerResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentContainerRequest request) {
        DocumentContainerResponse response = documentContainerService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/state")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить состояние жизненного цикла документа (ISO 19650)")
    public ResponseEntity<ApiResponse<DocumentContainerResponse>> changeState(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeLifecycleStateRequest request) {
        DocumentContainerResponse response = documentContainerService.changeLifecycleState(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/revisions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить новую ревизию документа (предыдущая становится заменённой)")
    public ResponseEntity<ApiResponse<DocumentRevisionResponse>> addRevision(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRevisionRequest request) {
        DocumentRevisionResponse response = documentContainerService.addRevision(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/revisions")
    @Operation(summary = "Получить все ревизии документа")
    public ResponseEntity<ApiResponse<List<DocumentRevisionResponse>>> getRevisions(@PathVariable UUID id) {
        List<DocumentRevisionResponse> revisions = documentContainerService.getRevisions(id);
        return ResponseEntity.ok(ApiResponse.ok(revisions));
    }

    @GetMapping("/{id}/audit")
    @Operation(summary = "Получить журнал аудита документа")
    public ResponseEntity<ApiResponse<PageResponse<DocumentAuditEntryResponse>>> getAuditTrail(
            @PathVariable UUID id,
            @PageableDefault(size = 50, sort = "performedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DocumentAuditEntryResponse> page = documentAuditService.getAuditTrailPaged(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить контейнер документа (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        documentContainerService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
