package com.privod.platform.modules.monthlySchedule.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleStatus;
import com.privod.platform.modules.monthlySchedule.service.MonthlyScheduleService;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleLineRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleLineResponse;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleResponse;
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
@RequestMapping("/api/monthly-schedules")
@RequiredArgsConstructor
@Tag(name = "Monthly Schedules", description = "Управление месячными графиками производства работ")
public class MonthlyScheduleController {

    private final MonthlyScheduleService scheduleService;

    @GetMapping
    @Operation(summary = "Список месячных графиков с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<MonthlyScheduleResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) MonthlyScheduleStatus status,
            @RequestParam(required = false) Integer year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MonthlyScheduleResponse> page = scheduleService.findAll(projectId, status, year, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить месячный график по ID")
    public ResponseEntity<ApiResponse<MonthlyScheduleResponse>> getById(@PathVariable UUID id) {
        MonthlyScheduleResponse response = scheduleService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать месячный график")
    public ResponseEntity<ApiResponse<MonthlyScheduleResponse>> create(
            @Valid @RequestBody CreateMonthlyScheduleRequest request) {
        MonthlyScheduleResponse response = scheduleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Отправить график на утверждение")
    public ResponseEntity<ApiResponse<MonthlyScheduleResponse>> submit(@PathVariable UUID id) {
        MonthlyScheduleResponse response = scheduleService.submit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить месячный график")
    public ResponseEntity<ApiResponse<MonthlyScheduleResponse>> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedById) {
        MonthlyScheduleResponse response = scheduleService.approve(id, approvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить месячный график (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        scheduleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Line endpoints ---

    @GetMapping("/{scheduleId}/lines")
    @Operation(summary = "Список строк месячного графика")
    public ResponseEntity<ApiResponse<PageResponse<MonthlyScheduleLineResponse>>> listLines(
            @PathVariable UUID scheduleId,
            @PageableDefault(size = 50, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<MonthlyScheduleLineResponse> page = scheduleService.findLines(scheduleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{scheduleId}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить строку в месячный график")
    public ResponseEntity<ApiResponse<MonthlyScheduleLineResponse>> addLine(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody CreateMonthlyScheduleLineRequest request) {
        MonthlyScheduleLineResponse response = scheduleService.addLine(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить строку графика (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteLine(@PathVariable UUID lineId) {
        scheduleService.deleteLine(lineId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
