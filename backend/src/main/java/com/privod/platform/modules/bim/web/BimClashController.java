package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.BimClashService;
import com.privod.platform.modules.bim.web.dto.BimClashResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimClashRequest;
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
@RequestMapping("/api/bim/clashes")
@RequiredArgsConstructor
@Tag(name = "BIM Clashes", description = "Управление коллизиями BIM")
public class BimClashController {

    private final BimClashService bimClashService;

    @GetMapping
    @Operation(summary = "Список коллизий с фильтрацией по модели")
    public ResponseEntity<ApiResponse<PageResponse<BimClashResponse>>> list(
            @RequestParam(required = false) UUID modelId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BimClashResponse> page = bimClashService.listClashes(modelId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить коллизию по ID")
    public ResponseEntity<ApiResponse<BimClashResponse>> getById(@PathVariable UUID id) {
        BimClashResponse response = bimClashService.getClash(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать коллизию")
    public ResponseEntity<ApiResponse<BimClashResponse>> create(
            @Valid @RequestBody CreateBimClashRequest request) {
        BimClashResponse response = bimClashService.createClash(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Решить коллизию")
    public ResponseEntity<ApiResponse<BimClashResponse>> resolve(
            @PathVariable UUID id,
            @RequestParam UUID resolvedById) {
        BimClashResponse response = bimClashService.resolveClash(id, resolvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить решение коллизии")
    public ResponseEntity<ApiResponse<BimClashResponse>> approve(@PathVariable UUID id) {
        BimClashResponse response = bimClashService.approveClash(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить коллизию")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        bimClashService.deleteClash(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
