package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.BimElementService;
import com.privod.platform.modules.bim.web.dto.BimElementResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimElementRequest;
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
@RequestMapping("/api/bim/elements")
@RequiredArgsConstructor
@Tag(name = "BIM Elements", description = "Управление элементами BIM модели")
public class BimElementController {

    private final BimElementService bimElementService;

    @GetMapping
    @Operation(summary = "Список элементов BIM модели")
    public ResponseEntity<ApiResponse<PageResponse<BimElementResponse>>> list(
            @RequestParam(required = false) UUID modelId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BimElementResponse> page = bimElementService.listElements(modelId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить элемент BIM по ID")
    public ResponseEntity<ApiResponse<BimElementResponse>> getById(@PathVariable UUID id) {
        BimElementResponse response = bimElementService.getElement(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать элемент BIM")
    public ResponseEntity<ApiResponse<BimElementResponse>> create(
            @Valid @RequestBody CreateBimElementRequest request) {
        BimElementResponse response = bimElementService.createElement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить элемент BIM")
    public ResponseEntity<ApiResponse<BimElementResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBimElementRequest request) {
        BimElementResponse response = bimElementService.updateElement(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить элемент BIM")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        bimElementService.deleteElement(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
