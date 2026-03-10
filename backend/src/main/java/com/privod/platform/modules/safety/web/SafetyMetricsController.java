package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyMetricsService;
import com.privod.platform.modules.safety.service.SafetyTrainingRecordService;
import com.privod.platform.modules.safety.web.dto.CreateTrainingRecordRequest;
import com.privod.platform.modules.safety.web.dto.SafetyMetricsResponse;
import com.privod.platform.modules.safety.web.dto.TrainingRecordResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/safety")
@RequiredArgsConstructor
@Tag(name = "Safety Metrics & Training Records", description = "Safety dashboard metrics and training journal")
public class SafetyMetricsController {

    private final SafetyMetricsService metricsService;
    private final SafetyTrainingRecordService trainingRecordService;

    @GetMapping("/metrics")
    @Operation(summary = "Get safety metrics (LTIR, TRIR, etc.)")
    public ResponseEntity<ApiResponse<SafetyMetricsResponse>> getMetrics(
            @RequestParam(required = false) String period) {
        SafetyMetricsResponse response = metricsService.getMetrics(period);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/training-records")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Get training records journal (per employee)")
    public ResponseEntity<ApiResponse<PageResponse<TrainingRecordResponse>>> listTrainingRecords(
            @RequestParam(required = false) UUID employeeId,
            @PageableDefault(size = 20, sort = "completedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TrainingRecordResponse> page = trainingRecordService.listRecords(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/training-records")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Create a training record")
    public ResponseEntity<ApiResponse<TrainingRecordResponse>> createTrainingRecord(
            @Valid @RequestBody CreateTrainingRecordRequest request) {
        TrainingRecordResponse response = trainingRecordService.createRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
