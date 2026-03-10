package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.domain.TimesheetPeriod;
import com.privod.platform.modules.hrRussian.domain.TimesheetPeriodStatus;
import com.privod.platform.modules.hrRussian.repository.TimesheetPeriodRepository;
import com.privod.platform.modules.hrRussian.web.dto.TimesheetPeriodResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr-russian/timesheets")
@RequiredArgsConstructor
@Tag(name = "HR Russian Timesheets", description = "Табели учёта рабочего времени (РФ)")
public class HrRussianTimesheetController {

    private final TimesheetPeriodRepository timesheetPeriodRepository;

    @GetMapping
    @Operation(summary = "List timesheet periods with pagination")
    public ResponseEntity<ApiResponse<PageResponse<TimesheetPeriodResponse>>> list(
            @PageableDefault(size = 20, sort = "year", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TimesheetPeriod> page = timesheetPeriodRepository.findByDeletedFalse(pageable);
        Page<TimesheetPeriodResponse> mapped = page.map(TimesheetPeriodResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get timesheet period by ID")
    public ResponseEntity<ApiResponse<TimesheetPeriodResponse>> getById(@PathVariable UUID id) {
        TimesheetPeriod period = timesheetPeriodRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Табель не найден: " + id));
        return ResponseEntity.ok(ApiResponse.ok(TimesheetPeriodResponse.fromEntity(period)));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit timesheet period for approval")
    public ResponseEntity<ApiResponse<TimesheetPeriodResponse>> submit(@PathVariable UUID id) {
        TimesheetPeriod period = timesheetPeriodRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Табель не найден: " + id));
        period.setStatus(TimesheetPeriodStatus.SUBMITTED);
        period = timesheetPeriodRepository.save(period);
        return ResponseEntity.ok(ApiResponse.ok(TimesheetPeriodResponse.fromEntity(period)));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a submitted timesheet period")
    public ResponseEntity<ApiResponse<TimesheetPeriodResponse>> approve(@PathVariable UUID id) {
        TimesheetPeriod period = timesheetPeriodRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Табель не найден: " + id));
        period.setStatus(TimesheetPeriodStatus.APPROVED);
        period = timesheetPeriodRepository.save(period);
        return ResponseEntity.ok(ApiResponse.ok(TimesheetPeriodResponse.fromEntity(period)));
    }
}
