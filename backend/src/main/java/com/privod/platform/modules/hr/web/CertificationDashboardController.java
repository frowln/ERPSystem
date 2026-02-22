package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hr.service.CertificationDashboardService;
import com.privod.platform.modules.hr.web.dto.CertificationDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
@Tag(name = "Certification Matrix", description = "Certification compliance dashboard and alerts")
public class CertificationDashboardController {

    private final CertificationDashboardService dashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Get certification compliance dashboard")
    public ResponseEntity<ApiResponse<CertificationDashboardResponse>> getDashboard() {
        CertificationDashboardResponse dashboard = dashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
