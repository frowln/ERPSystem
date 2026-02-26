package com.privod.platform.modules.specification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.specification.domain.ProcurementSchedule;
import com.privod.platform.modules.specification.service.ProcurementScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/procurement-schedules")
@RequiredArgsConstructor
@Tag(name = "Procurement Schedules", description = "Procurement schedule management")
public class ProcurementScheduleController {

    private final ProcurementScheduleService service;

    @GetMapping
    @Operation(summary = "List procurement schedule items for a project")
    public ResponseEntity<ApiResponse<List<ProcurementSchedule>>> list(@RequestParam UUID projectId) {
        List<ProcurementSchedule> items = service.listByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Generate procurement schedule from specification items")
    public ResponseEntity<ApiResponse<List<ProcurementSchedule>>> generate(@RequestBody Map<String, String> body) {
        UUID projectId = UUID.fromString(body.get("projectId"));
        UUID specificationId = UUID.fromString(body.get("specificationId"));
        LocalDate startDate = body.get("projectStartDate") != null
                ? LocalDate.parse(body.get("projectStartDate"))
                : LocalDate.now();
        List<ProcurementSchedule> items = service.generate(projectId, specificationId, startDate);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(items));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update procurement schedule item status")
    public ResponseEntity<ApiResponse<ProcurementSchedule>> updateStatus(
            @PathVariable UUID id, @RequestBody Map<String, String> body) {
        ProcurementSchedule updated = service.updateStatus(id, body.get("status"));
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
