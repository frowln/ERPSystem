package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.service.FeatureFlagService;
import com.privod.platform.modules.settings.web.dto.FeatureFlagResponse;
import com.privod.platform.modules.settings.web.dto.UpdateFeatureFlagRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feature-flags")
@RequiredArgsConstructor
@Tag(name = "Feature Flags", description = "Управление feature flags")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить все feature flags")
    public ResponseEntity<ApiResponse<List<FeatureFlagResponse>>> getAll() {
        List<FeatureFlagResponse> flags = featureFlagService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(flags));
    }

    @GetMapping("/check")
    @Operation(summary = "Проверить состояние feature flag")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> check(@RequestParam String key) {
        boolean enabled = featureFlagService.isEnabled(key);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("enabled", enabled)));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Включить/выключить feature flag")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> update(
            @PathVariable String key,
            @Valid @RequestBody UpdateFeatureFlagRequest request) {
        FeatureFlagResponse flag = featureFlagService.setEnabled(key, request.enabled());
        return ResponseEntity.ok(ApiResponse.ok(flag));
    }
}
