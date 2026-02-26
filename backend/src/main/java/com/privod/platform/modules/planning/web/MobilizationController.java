package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.planning.domain.MobilizationLine;
import com.privod.platform.modules.planning.domain.MobilizationSchedule;
import com.privod.platform.modules.planning.service.MobilizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/mobilization-schedules")
@RequiredArgsConstructor
@Tag(name = "Mobilization Schedules", description = "Mobilization schedule management")
public class MobilizationController {

    private final MobilizationService service;

    @GetMapping
    @Operation(summary = "List mobilization schedules for a project")
    public ResponseEntity<ApiResponse<List<MobilizationSchedule>>> list(@RequestParam UUID projectId) {
        List<MobilizationSchedule> schedules = service.listByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(schedules));
    }

    @GetMapping("/{id}/lines")
    @Operation(summary = "Get lines of a mobilization schedule")
    public ResponseEntity<ApiResponse<List<MobilizationLine>>> getLines(@PathVariable UUID id) {
        List<MobilizationLine> lines = service.getLines(id);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Generate a mobilization schedule for a project")
    public ResponseEntity<ApiResponse<MobilizationSchedule>> generate(@RequestBody Map<String, String> body) {
        UUID projectId = UUID.fromString(body.get("projectId"));
        MobilizationSchedule schedule = service.generate(projectId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(schedule));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Add a line to a mobilization schedule")
    public ResponseEntity<ApiResponse<MobilizationLine>> addLine(
            @PathVariable UUID id,
            @RequestBody MobilizationLine line) {
        MobilizationLine saved = service.addLine(id, line);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(saved));
    }
}
