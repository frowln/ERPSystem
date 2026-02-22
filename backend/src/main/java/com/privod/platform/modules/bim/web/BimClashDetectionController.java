package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.domain.BimElementMetadata;
import com.privod.platform.modules.bim.domain.ClashResultStatus;
import com.privod.platform.modules.bim.domain.ClashType;
import com.privod.platform.modules.bim.service.BimClashDetectionService;
import com.privod.platform.modules.bim.web.dto.AssignClashRequest;
import com.privod.platform.modules.bim.web.dto.ClashResultResponse;
import com.privod.platform.modules.bim.web.dto.ClashSummaryResponse;
import com.privod.platform.modules.bim.web.dto.ClashTestResponse;
import com.privod.platform.modules.bim.web.dto.CreateClashTestRequest;
import com.privod.platform.modules.bim.web.dto.ElementMetadataRequest;
import com.privod.platform.modules.bim.web.dto.ResolveClashRequest;
import com.privod.platform.modules.bim.web.dto.StartViewerSessionRequest;
import com.privod.platform.modules.bim.web.dto.ViewerSessionResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bim/clash-detection")
@RequiredArgsConstructor
@Tag(name = "BIM Clash Detection", description = "Обнаружение коллизий BIM моделей")
public class BimClashDetectionController {

    private final BimClashDetectionService clashDetectionService;

    // ─── Clash Tests ─────────────────────────────────────────────────────────

    @PostMapping("/tests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать тест коллизий между двумя моделями")
    public ResponseEntity<ApiResponse<ClashTestResponse>> createClashTest(
            @Valid @RequestBody CreateClashTestRequest request) {
        ClashTestResponse response = clashDetectionService.createClashTest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/tests")
    @Operation(summary = "Список тестов коллизий с фильтрацией по проекту")
    public ResponseEntity<ApiResponse<PageResponse<ClashTestResponse>>> listClashTests(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClashTestResponse> page = clashDetectionService.listClashTests(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/tests/{id}")
    @Operation(summary = "Получить тест коллизий по ID")
    public ResponseEntity<ApiResponse<ClashTestResponse>> getClashTest(@PathVariable UUID id) {
        ClashTestResponse response = clashDetectionService.getClashTest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/tests/{id}/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Запустить тест коллизий (симуляция)")
    public ResponseEntity<ApiResponse<ClashTestResponse>> runClashTest(@PathVariable UUID id) {
        ClashTestResponse response = clashDetectionService.runClashTest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/tests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить тест коллизий")
    public ResponseEntity<ApiResponse<Void>> deleteClashTest(@PathVariable UUID id) {
        clashDetectionService.deleteClashTest(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Clash Results ───────────────────────────────────────────────────────

    @GetMapping("/tests/{testId}/results")
    @Operation(summary = "Результаты теста коллизий с фильтрацией по статусу/типу")
    public ResponseEntity<ApiResponse<PageResponse<ClashResultResponse>>> getClashResults(
            @PathVariable UUID testId,
            @RequestParam(required = false) ClashResultStatus status,
            @RequestParam(required = false) ClashType clashType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClashResultResponse> page = clashDetectionService.getClashResults(testId, status, clashType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/results/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Решить коллизию")
    public ResponseEntity<ApiResponse<ClashResultResponse>> resolveClash(
            @PathVariable UUID id,
            @RequestBody(required = false) ResolveClashRequest request) {
        String notes = request != null ? request.resolutionNotes() : null;
        ClashResultResponse response = clashDetectionService.resolveClash(id, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/results/{id}/ignore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Игнорировать коллизию")
    public ResponseEntity<ApiResponse<ClashResultResponse>> ignoreClash(
            @PathVariable UUID id,
            @RequestBody(required = false) ResolveClashRequest request) {
        String notes = request != null ? request.resolutionNotes() : null;
        ClashResultResponse response = clashDetectionService.ignoreClash(id, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/results/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Назначить ответственного за коллизию")
    public ResponseEntity<ApiResponse<ClashResultResponse>> assignClash(
            @PathVariable UUID id,
            @Valid @RequestBody AssignClashRequest request) {
        ClashResultResponse response = clashDetectionService.assignClash(id, request.userId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ─── Clash Summary ───────────────────────────────────────────────────────

    @GetMapping("/summary")
    @Operation(summary = "Сводка коллизий по проекту — количества по статусам")
    public ResponseEntity<ApiResponse<ClashSummaryResponse>> getClashSummary(
            @RequestParam UUID projectId) {
        ClashSummaryResponse response = clashDetectionService.getClashSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ─── Viewer Sessions ─────────────────────────────────────────────────────

    @PostMapping("/viewer-sessions")
    @Operation(summary = "Начать сессию просмотра BIM модели")
    public ResponseEntity<ApiResponse<ViewerSessionResponse>> startViewerSession(
            @Valid @RequestBody StartViewerSessionRequest request) {
        ViewerSessionResponse response = clashDetectionService.startViewerSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/viewer-sessions/{id}/end")
    @Operation(summary = "Завершить сессию просмотра")
    public ResponseEntity<ApiResponse<ViewerSessionResponse>> endViewerSession(@PathVariable UUID id) {
        ViewerSessionResponse response = clashDetectionService.endViewerSession(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ─── Element Metadata ────────────────────────────────────────────────────

    @PostMapping("/models/{modelId}/metadata")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Импорт метаданных элементов IFC модели")
    public ResponseEntity<ApiResponse<Integer>> importElementMetadata(
            @PathVariable UUID modelId,
            @Valid @RequestBody List<ElementMetadataRequest> metadataList) {
        int count = clashDetectionService.importElementMetadata(modelId, metadataList);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(count));
    }

    @GetMapping("/models/{modelId}/metadata")
    @Operation(summary = "Получить метаданные элементов модели")
    public ResponseEntity<ApiResponse<PageResponse<BimElementMetadata>>> getElementMetadata(
            @PathVariable UUID modelId,
            @PageableDefault(size = 50, sort = "elementGuid") Pageable pageable) {
        Page<BimElementMetadata> page = clashDetectionService.getElementMetadata(modelId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
