package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.Ks11Status;
import com.privod.platform.modules.pto.service.Ks11AcceptanceActService;
import com.privod.platform.modules.pto.web.dto.CreateKs11AcceptanceActRequest;
import com.privod.platform.modules.pto.web.dto.Ks11AcceptanceActResponse;
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
@RequestMapping("/api/ks11-acceptance-acts")
@RequiredArgsConstructor
@Tag(name = "KS-11 Acceptance Acts", description = "Управление актами приёмки КС-11")
public class Ks11AcceptanceActController {

    private final Ks11AcceptanceActService ks11Service;

    @GetMapping
    @Operation(summary = "Список актов приёмки КС-11")
    public ResponseEntity<ApiResponse<PageResponse<Ks11AcceptanceActResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Ks11Status status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Ks11AcceptanceActResponse> page = ks11Service.findAll(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить акт приёмки КС-11 по ID")
    public ResponseEntity<ApiResponse<Ks11AcceptanceActResponse>> getById(@PathVariable UUID id) {
        Ks11AcceptanceActResponse response = ks11Service.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать акт приёмки КС-11")
    public ResponseEntity<ApiResponse<Ks11AcceptanceActResponse>> create(
            @Valid @RequestBody CreateKs11AcceptanceActRequest request) {
        Ks11AcceptanceActResponse response = ks11Service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус акта приёмки КС-11")
    public ResponseEntity<ApiResponse<Ks11AcceptanceActResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam Ks11Status status) {
        Ks11AcceptanceActResponse response = ks11Service.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить акт приёмки КС-11 (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ks11Service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
