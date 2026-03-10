package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.domain.NonConformance;
import com.privod.platform.modules.quality.repository.NonConformanceRepository;
import com.privod.platform.modules.quality.web.dto.DefectRegisterEntryResponse;
import com.privod.platform.modules.quality.web.dto.DefectStatisticsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quality")
@RequiredArgsConstructor
@Tag(name = "Defect Register", description = "Defect register and statistics endpoints")
public class DefectRegisterController {

    private final NonConformanceRepository nonConformanceRepository;

    @GetMapping("/defect-register")
    @Operation(summary = "List defect register entries (based on non-conformances)")
    public ResponseEntity<ApiResponse<PageResponse<DefectRegisterEntryResponse>>> listDefectRegister(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<NonConformance> page;
        if (projectId != null) {
            page = nonConformanceRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else {
            page = nonConformanceRepository.findByDeletedFalse(pageable);
        }

        Page<DefectRegisterEntryResponse> responsePage = page.map(nc ->
                DefectRegisterEntryResponse.fromNonConformance(nc, null));

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(responsePage)));
    }

    @GetMapping("/defect-statistics")
    @Operation(summary = "Get defect statistics aggregated from non-conformances")
    public ResponseEntity<ApiResponse<DefectStatisticsResponse>> getDefectStatistics(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String severity) {

        // Aggregate by severity
        List<Object[]> severityCounts = nonConformanceRepository.countBySeverity(projectId);
        long total = 0;
        List<DefectStatisticsResponse.SeverityCount> bySeverity = new ArrayList<>();
        for (Object[] row : severityCounts) {
            String sev = row[0].toString().toLowerCase();
            long count = ((Number) row[1]).longValue();
            bySeverity.add(new DefectStatisticsResponse.SeverityCount(sev, count));
            total += count;
        }

        // Aggregate by status (as "type" for frontend compatibility)
        List<Object[]> statusCounts = nonConformanceRepository.countByStatus(projectId);
        List<DefectStatisticsResponse.TypeCount> byType = new ArrayList<>();
        for (Object[] row : statusCounts) {
            String type = row[0].toString().toLowerCase();
            long count = ((Number) row[1]).longValue();
            double pct = total > 0 ? (count * 100.0 / total) : 0;
            byType.add(new DefectStatisticsResponse.TypeCount(type, count, Math.round(pct * 10.0) / 10.0));
        }

        DefectStatisticsResponse response = new DefectStatisticsResponse(byType, bySeverity, total);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
