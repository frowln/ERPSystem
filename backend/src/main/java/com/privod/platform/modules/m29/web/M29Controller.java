package com.privod.platform.modules.m29.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.m29.domain.M29Status;
import com.privod.platform.modules.m29.service.M29Service;
import com.privod.platform.modules.m29.web.dto.CreateM29LineRequest;
import com.privod.platform.modules.m29.web.dto.CreateM29Request;
import com.privod.platform.modules.m29.web.dto.M29LineResponse;
import com.privod.platform.modules.m29.web.dto.M29ListResponse;
import com.privod.platform.modules.m29.web.dto.M29Response;
import com.privod.platform.modules.m29.web.dto.UpdateM29LineRequest;
import com.privod.platform.modules.m29.web.dto.UpdateM29Request;
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
@RequestMapping("/api/m29")
@RequiredArgsConstructor
@Tag(name = "М-29", description = "Отчёты о расходе материалов (М-29)")
public class M29Controller {

    private final M29Service m29Service;

    @GetMapping
    @Operation(summary = "Список документов М-29 с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<M29ListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) M29Status status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<M29ListResponse> page = m29Service.listM29(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить документ М-29 по ID со строками")
    public ResponseEntity<ApiResponse<M29Response>> getById(@PathVariable UUID id) {
        M29Response response = m29Service.getM29(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Создать новый документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> create(
            @Valid @RequestBody CreateM29Request request) {
        M29Response response = m29Service.createM29(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Обновить документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateM29Request request) {
        M29Response response = m29Service.updateM29(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Добавить строку в документ М-29")
    public ResponseEntity<ApiResponse<M29LineResponse>> addLine(
            @PathVariable UUID id,
            @Valid @RequestBody CreateM29LineRequest request) {
        M29LineResponse response = m29Service.addLine(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Обновить строку документа М-29")
    public ResponseEntity<ApiResponse<M29LineResponse>> updateLine(
            @PathVariable UUID lineId,
            @Valid @RequestBody UpdateM29LineRequest request) {
        M29LineResponse response = m29Service.updateLine(lineId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Удалить строку документа М-29")
    public ResponseEntity<ApiResponse<Void>> removeLine(@PathVariable UUID lineId) {
        m29Service.removeLine(lineId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Подтвердить документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> confirm(@PathVariable UUID id) {
        M29Response response = m29Service.confirmM29(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Проверить документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> verify(@PathVariable UUID id) {
        M29Response response = m29Service.verifyM29(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> approve(@PathVariable UUID id) {
        M29Response response = m29Service.approveM29(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Провести документ М-29")
    public ResponseEntity<ApiResponse<M29Response>> post(@PathVariable UUID id) {
        M29Response response = m29Service.postM29(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
