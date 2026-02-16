package com.privod.platform.modules.immutableAudit.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.immutableAudit.service.ImmutableRecordService;
import com.privod.platform.modules.immutableAudit.web.dto.ChainVerificationResponse;
import com.privod.platform.modules.immutableAudit.web.dto.CreateImmutableRecordRequest;
import com.privod.platform.modules.immutableAudit.web.dto.ImmutableRecordResponse;
import com.privod.platform.modules.immutableAudit.web.dto.RecordSupersessionResponse;
import com.privod.platform.modules.immutableAudit.web.dto.SupersedeRecordRequest;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/immutable-records")
@RequiredArgsConstructor
@Tag(name = "Immutable Audit Trail", description = "Неизменяемый аудит-трейл (Aconex-grade)")
public class ImmutableRecordController {

    private final ImmutableRecordService recordService;

    @GetMapping
    @Operation(summary = "Список неизменяемых записей с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<ImmutableRecordResponse>>> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @PageableDefault(size = 20, sort = "recordedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ImmutableRecordResponse> page = recordService.findAll(entityType, entityId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить неизменяемую запись по ID")
    public ResponseEntity<ApiResponse<ImmutableRecordResponse>> getById(@PathVariable UUID id) {
        ImmutableRecordResponse response = recordService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM')")
    @Operation(summary = "Создать неизменяемую запись")
    public ResponseEntity<ApiResponse<ImmutableRecordResponse>> create(
            @Valid @RequestBody CreateImmutableRecordRequest request) {
        ImmutableRecordResponse response = recordService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/supersede")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM')")
    @Operation(summary = "Заместить запись (supersede)")
    public ResponseEntity<ApiResponse<ImmutableRecordResponse>> supersede(
            @Valid @RequestBody SupersedeRecordRequest request) {
        ImmutableRecordResponse response = recordService.supersede(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/verify")
    @Operation(summary = "Верифицировать целостность цепочки записей")
    public ResponseEntity<ApiResponse<ChainVerificationResponse>> verifyChain(
            @RequestParam String entityType,
            @RequestParam UUID entityId) {
        ChainVerificationResponse response = recordService.verifyChain(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/supersessions")
    @Operation(summary = "Получить историю замещений записи")
    public ResponseEntity<ApiResponse<List<RecordSupersessionResponse>>> getSupersessions(
            @PathVariable UUID id) {
        List<RecordSupersessionResponse> supersessions = recordService.getSupersessions(id);
        return ResponseEntity.ok(ApiResponse.ok(supersessions));
    }
}
