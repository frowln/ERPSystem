package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.auth.service.AnonymizationService;
import com.privod.platform.modules.auth.service.UserDataExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoints for personal data export (152-ФЗ ст. 14 / GDPR Art. 20) and
 * account deletion with anonymization (152-ФЗ ст. 21 / GDPR Art. 17).
 */
@RestController
@RequestMapping("/api/me")
@Tag(name = "User Data", description = "Personal data export and account deletion")
@RequiredArgsConstructor
public class UserDataController {

    private final UserDataExportService userDataExportService;
    private final AnonymizationService anonymizationService;

    @GetMapping("/export")
    @Operation(summary = "Export all personal data (GDPR / 152-ФЗ)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportMyData() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        Map<String, Object> data = userDataExportService.exportUserData(userId);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @DeleteMapping
    @Operation(summary = "Delete account and anonymize personal data")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        anonymizationService.anonymizeUser(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
