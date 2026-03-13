package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.ScheduleBaselineService;
import com.privod.platform.modules.planning.web.dto.BaselineDiffResponse;
import com.privod.platform.modules.planning.web.dto.CreateScheduleBaselineRequest;
import com.privod.platform.modules.planning.web.dto.ScheduleBaselineResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/schedule-baselines")
@RequiredArgsConstructor
@Tag(name = "Schedule Baselines", description = "Управление базовыми планами расписания")
public class ScheduleBaselineController {

    private final ScheduleBaselineService baselineService;

    @GetMapping
    @Operation(summary = "Получить базовые планы проекта с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<ScheduleBaselineResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "baselineDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ScheduleBaselineResponse> page = baselineService.findByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить базовый план по ID")
    public ResponseEntity<ApiResponse<ScheduleBaselineResponse>> getById(@PathVariable UUID id) {
        ScheduleBaselineResponse response = baselineService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать базовый план расписания")
    public ResponseEntity<ApiResponse<ScheduleBaselineResponse>> create(
            @Valid @RequestBody CreateScheduleBaselineRequest request) {
        ScheduleBaselineResponse response = baselineService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * P2-PRJ-2: Compare baseline against current schedule state.
     * Returns per-node deltas: startDate slip, endDate slip, ADDED/REMOVED/CHANGED status.
     */
    @GetMapping("/{id}/diff")
    @Operation(summary = "Сравнение базового плана с текущим расписанием (P2-PRJ-2)")
    public ResponseEntity<ApiResponse<BaselineDiffResponse>> diff(@PathVariable UUID id) {
        BaselineDiffResponse response = baselineService.compareWithCurrent(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить базовый план (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        baselineService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
