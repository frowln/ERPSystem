package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.domain.RotationStatus;
import com.privod.platform.modules.hrRussian.service.RotationScheduleService;
import com.privod.platform.modules.hrRussian.web.dto.CreateRotationScheduleRequest;
import com.privod.platform.modules.hrRussian.web.dto.RotationScheduleResponse;
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

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * P1-HR-5: Управление вахтовыми графиками (Глава 47 ТК РФ).
 */
@RestController
@RequestMapping("/api/hr/rotation-schedules")
@RequiredArgsConstructor
@Tag(name = "Rotation Schedules", description = "Вахтовый метод (Глава 47 ТК РФ)")
public class RotationScheduleController {

    private final RotationScheduleService rotationService;

    @GetMapping
    @Operation(summary = "Список вахтовых графиков")
    public ResponseEntity<ApiResponse<PageResponse<RotationScheduleResponse>>> list(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) RotationStatus status,
            @PageableDefault(size = 20, sort = "shiftStart", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RotationScheduleResponse> page = rotationService.list(employeeId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить вахтовый график по ID")
    public ResponseEntity<ApiResponse<RotationScheduleResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(rotationService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Создать вахтовый график (ст. 302 ТК РФ)")
    public ResponseEntity<ApiResponse<RotationScheduleResponse>> create(
            @Valid @RequestBody CreateRotationScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(rotationService.create(request)));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Изменить статус вахтового графика")
    public ResponseEntity<ApiResponse<RotationScheduleResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam RotationStatus status,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.ok(rotationService.updateStatus(id, status, notes)));
    }

    @PostMapping("/{id}/calculate-bonus")
    @Operation(summary = "P1-HR-5: Рассчитать вахтовую надбавку (ст. 302 ТК РФ)")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateBonus(
            @PathVariable UUID id,
            @RequestParam BigDecimal dailyTariffRate) {
        return ResponseEntity.ok(ApiResponse.ok(rotationService.calculateShiftBonus(id, dailyTariffRate)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить вахтовый график")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        rotationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
