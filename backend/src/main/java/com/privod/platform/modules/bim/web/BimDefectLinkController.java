package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.BimDefectLinkService;
import com.privod.platform.modules.bim.web.dto.BimDefectViewResponse;
import com.privod.platform.modules.bim.web.dto.CreateDefectBimLinkRequest;
import com.privod.platform.modules.bim.web.dto.CreateSavedViewRequest;
import com.privod.platform.modules.bim.web.dto.DefectBimLinkResponse;
import com.privod.platform.modules.bim.web.dto.DefectHeatmapResponse;
import com.privod.platform.modules.bim.web.dto.UpdateDefectBimLinkRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bim/defect-links")
@RequiredArgsConstructor
@Tag(name = "BIM Defect Links", description = "Привязка дефектов к элементам BIM модели")
public class BimDefectLinkController {

    private final BimDefectLinkService bimDefectLinkService;

    // ──────────────────── Link CRUD ────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Привязать дефект к элементу BIM модели")
    public ResponseEntity<ApiResponse<DefectBimLinkResponse>> linkDefect(
            @Valid @RequestBody CreateDefectBimLinkRequest request) {
        DefectBimLinkResponse response = bimDefectLinkService.linkDefectToElement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{linkId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить привязку дефекта к BIM элементу")
    public ResponseEntity<ApiResponse<DefectBimLinkResponse>> updateLink(
            @PathVariable UUID linkId,
            @Valid @RequestBody UpdateDefectBimLinkRequest request) {
        DefectBimLinkResponse response = bimDefectLinkService.updateLink(linkId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{linkId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить привязку дефекта к BIM элементу")
    public ResponseEntity<ApiResponse<Void>> unlinkDefect(@PathVariable UUID linkId) {
        bimDefectLinkService.unlinkDefect(linkId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ──────────────────── Queries ────────────────────

    @GetMapping("/by-defect/{defectId}")
    @Operation(summary = "Получить все BIM-привязки для дефекта")
    public ResponseEntity<ApiResponse<List<DefectBimLinkResponse>>> getLinksForDefect(
            @PathVariable UUID defectId) {
        List<DefectBimLinkResponse> links = bimDefectLinkService.getLinksForDefect(defectId);
        return ResponseEntity.ok(ApiResponse.ok(links));
    }

    @GetMapping("/by-model/{modelId}")
    @Operation(summary = "Получить все привязки дефектов для BIM модели с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<DefectBimLinkResponse>>> getLinksForModel(
            @PathVariable UUID modelId,
            @RequestParam(required = false) String floorName,
            @RequestParam(required = false) String systemName,
            @RequestParam(required = false) String elementType,
            @PageableDefault(size = 20, sort = "linkedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DefectBimLinkResponse> page = bimDefectLinkService.getLinksForModel(
                modelId, floorName, systemName, elementType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/by-project/{projectId}")
    @Operation(summary = "Карта дефектов по проекту с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<DefectBimLinkResponse>>> getLinksForProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String floorName,
            @RequestParam(required = false) String systemName,
            @RequestParam(required = false) String elementType,
            @PageableDefault(size = 20, sort = "linkedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DefectBimLinkResponse> page = bimDefectLinkService.getLinksForProject(
                projectId, floorName, systemName, elementType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/by-floor/{projectId}")
    @Operation(summary = "Список дефектов по этажу")
    public ResponseEntity<ApiResponse<List<DefectBimLinkResponse>>> getDefectsByFloor(
            @PathVariable UUID projectId,
            @RequestParam String floorName) {
        List<DefectBimLinkResponse> links = bimDefectLinkService.getDefectsByFloor(projectId, floorName);
        return ResponseEntity.ok(ApiResponse.ok(links));
    }

    @GetMapping("/by-system/{projectId}")
    @Operation(summary = "Список дефектов по системе")
    public ResponseEntity<ApiResponse<List<DefectBimLinkResponse>>> getDefectsBySystem(
            @PathVariable UUID projectId,
            @RequestParam String systemName) {
        List<DefectBimLinkResponse> links = bimDefectLinkService.getDefectsBySystem(projectId, systemName);
        return ResponseEntity.ok(ApiResponse.ok(links));
    }

    // ──────────────────── Heatmap ────────────────────

    @GetMapping("/heatmap/{projectId}")
    @Operation(summary = "Тепловая карта дефектов по проекту (агрегация по этажам/системам)")
    public ResponseEntity<ApiResponse<DefectHeatmapResponse>> getDefectHeatmap(
            @PathVariable UUID projectId) {
        DefectHeatmapResponse heatmap = bimDefectLinkService.getDefectHeatmap(projectId);
        return ResponseEntity.ok(ApiResponse.ok(heatmap));
    }

    // ──────────────────── Saved views ────────────────────

    @PostMapping("/views")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать сохранённое представление для навигации по дефектам")
    public ResponseEntity<ApiResponse<BimDefectViewResponse>> createSavedView(
            @Valid @RequestBody CreateSavedViewRequest request) {
        BimDefectViewResponse response = bimDefectLinkService.createSavedView(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/views/{projectId}")
    @Operation(summary = "Получить сохранённые представления для проекта")
    public ResponseEntity<ApiResponse<List<BimDefectViewResponse>>> getSavedViews(
            @PathVariable UUID projectId) {
        List<BimDefectViewResponse> views = bimDefectLinkService.getSavedViews(projectId);
        return ResponseEntity.ok(ApiResponse.ok(views));
    }

    @DeleteMapping("/views/{viewId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить сохранённое представление")
    public ResponseEntity<ApiResponse<Void>> deleteSavedView(@PathVariable UUID viewId) {
        bimDefectLinkService.deleteSavedView(viewId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
