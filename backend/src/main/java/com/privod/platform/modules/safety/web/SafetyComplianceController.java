package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyComplianceService;
import com.privod.platform.modules.safety.web.dto.AccessBlockResponse;
import com.privod.platform.modules.safety.web.dto.AccessComplianceResponse;
import com.privod.platform.modules.safety.web.dto.AutoScheduleResponse;
import com.privod.platform.modules.safety.web.dto.CertificateComplianceResponse;
import com.privod.platform.modules.safety.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.safety.web.dto.PrescriptionTrackerResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/safety/compliance")
@RequiredArgsConstructor
@Tag(name = "Safety Compliance", description = "Safety compliance engine with auto-scheduling")
public class SafetyComplianceController {

    private final SafetyComplianceService complianceService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get compliance dashboard statistics")
    public ResponseEntity<ApiResponse<ComplianceDashboardResponse>> getDashboard() {
        ComplianceDashboardResponse response = complianceService.getComplianceDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/auto-schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Trigger auto-scheduling of briefings based on rules")
    public ResponseEntity<ApiResponse<AutoScheduleResponse>> autoSchedule() {
        AutoScheduleResponse response = complianceService.autoScheduleBriefings();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/certificate-check/{employeeId}")
    @Operation(summary = "Check certificate compliance for an employee")
    public ResponseEntity<ApiResponse<CertificateComplianceResponse>> checkCertificateCompliance(
            @PathVariable UUID employeeId) {
        CertificateComplianceResponse response = complianceService.checkCertificateCompliance(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/access-check/{employeeId}")
    @Operation(summary = "Check access compliance for an employee")
    public ResponseEntity<ApiResponse<AccessComplianceResponse>> checkAccessCompliance(
            @PathVariable UUID employeeId) {
        AccessComplianceResponse response = complianceService.checkAccessCompliance(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/access-blocks")
    @Operation(summary = "List active access blocks")
    public ResponseEntity<ApiResponse<PageResponse<AccessBlockResponse>>> getAccessBlocks(
            @PageableDefault(size = 20, sort = "blockedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AccessBlockResponse> page = complianceService.getActiveAccessBlocks(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/access-blocks/{employeeId}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Resolve access block for an employee")
    public ResponseEntity<ApiResponse<AccessBlockResponse>> resolveAccessBlock(
            @PathVariable UUID employeeId) {
        AccessBlockResponse response = complianceService.resolveAccessBlock(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/prescriptions")
    @Operation(summary = "Get prescription tracker with countdown to deadlines")
    public ResponseEntity<ApiResponse<PrescriptionTrackerResponse>> getPrescriptions() {
        PrescriptionTrackerResponse response = complianceService.getPrescriptionTracker();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
