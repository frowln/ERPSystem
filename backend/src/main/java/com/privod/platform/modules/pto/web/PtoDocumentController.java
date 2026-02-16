package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import com.privod.platform.modules.pto.service.PtoDocumentService;
import com.privod.platform.modules.pto.web.dto.ChangePtoStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreatePtoDocumentRequest;
import com.privod.platform.modules.pto.web.dto.PtoDocumentResponse;
import com.privod.platform.modules.pto.web.dto.UpdatePtoDocumentRequest;
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
@RequestMapping("/api/pto/documents")
@RequiredArgsConstructor
@Tag(name = "PTO Documents", description = "Управление документами ПТО")
public class PtoDocumentController {

    private final PtoDocumentService documentService;

    @GetMapping
    @Operation(summary = "Список ПТО документов с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<PtoDocumentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) PtoDocumentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PtoDocumentResponse> page = documentService.listDocuments(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить ПТО документ по ID")
    public ResponseEntity<ApiResponse<PtoDocumentResponse>> getById(@PathVariable UUID id) {
        PtoDocumentResponse response = documentService.getDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новый ПТО документ")
    public ResponseEntity<ApiResponse<PtoDocumentResponse>> create(
            @Valid @RequestBody CreatePtoDocumentRequest request) {
        PtoDocumentResponse response = documentService.createDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить ПТО документ")
    public ResponseEntity<ApiResponse<PtoDocumentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePtoDocumentRequest request) {
        PtoDocumentResponse response = documentService.updateDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус ПТО документа")
    public ResponseEntity<ApiResponse<PtoDocumentResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePtoStatusRequest request) {
        PtoDocumentResponse response = documentService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить ПТО документ (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
