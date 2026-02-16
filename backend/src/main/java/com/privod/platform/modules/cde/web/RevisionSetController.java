package com.privod.platform.modules.cde.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.cde.service.RevisionSetService;
import com.privod.platform.modules.cde.web.dto.CreateRevisionSetRequest;
import com.privod.platform.modules.cde.web.dto.RevisionSetResponse;
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
@RequestMapping("/api/cde/revision-sets")
@RequiredArgsConstructor
@Tag(name = "CDE Revision Sets", description = "ISO 19650 Revision Set management")
public class RevisionSetController {

    private final RevisionSetService revisionSetService;

    @GetMapping
    @Operation(summary = "Список наборов ревизий проекта")
    public ResponseEntity<ApiResponse<PageResponse<RevisionSetResponse>>> list(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<RevisionSetResponse> page = revisionSetService.findByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить набор ревизий по ID")
    public ResponseEntity<ApiResponse<RevisionSetResponse>> getById(@PathVariable UUID id) {
        RevisionSetResponse response = revisionSetService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать набор ревизий")
    public ResponseEntity<ApiResponse<RevisionSetResponse>> create(
            @Valid @RequestBody CreateRevisionSetRequest request) {
        RevisionSetResponse response = revisionSetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить набор ревизий")
    public ResponseEntity<ApiResponse<RevisionSetResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRevisionSetRequest request) {
        RevisionSetResponse response = revisionSetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить набор ревизий (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        revisionSetService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
