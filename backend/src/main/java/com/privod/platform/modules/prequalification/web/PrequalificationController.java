package com.privod.platform.modules.prequalification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.prequalification.service.PrequalificationService;
import com.privod.platform.modules.prequalification.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.prequalification.web.dto.PrequalificationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/prequalifications")
@RequiredArgsConstructor
@Tag(name = "Prequalification", description = "Преквалификация подрядчиков и поставщиков")
public class PrequalificationController {

    private final PrequalificationService service;

    @GetMapping
    @Operation(summary = "Список преквалификаций")
    public ResponseEntity<ApiResponse<PageResponse<PrequalificationResponse>>> list(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PrequalificationResponse> page = service.list(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить преквалификацию по ID")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Создать преквалификацию подрядчика")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> create(
            @Valid @RequestBody CreatePrequalificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(request)));
    }

    @PostMapping("/{id}/evaluate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Оценить и завершить преквалификацию")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> evaluate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.evaluate(id)));
    }
}
