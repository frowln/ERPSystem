package com.privod.platform.modules.apiManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.apiManagement.service.ApiRateLimitService;
import com.privod.platform.modules.apiManagement.web.dto.ApiRateLimitResponse;
import com.privod.platform.modules.apiManagement.web.dto.SetRateLimitRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/api-management/rate-limits")
@RequiredArgsConstructor
@Tag(name = "API Rate Limits", description = "API rate limit configuration endpoints")
public class ApiRateLimitController {

    private final ApiRateLimitService rateLimitService;

    @GetMapping("/{apiKeyId}")
    @Operation(summary = "Get rate limit for an API key")
    public ResponseEntity<ApiResponse<ApiRateLimitResponse>> getRateLimit(@PathVariable UUID apiKeyId) {
        ApiRateLimitResponse response = rateLimitService.getRateLimit(apiKeyId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{apiKeyId}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Set rate limit for an API key")
    public ResponseEntity<ApiResponse<ApiRateLimitResponse>> setRateLimit(
            @PathVariable UUID apiKeyId,
            @Valid @RequestBody SetRateLimitRequest request) {
        ApiRateLimitResponse response = rateLimitService.setRateLimit(apiKeyId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{apiKeyId}/check")
    @Operation(summary = "Check if an API key is rate-limited")
    public ResponseEntity<ApiResponse<Boolean>> checkRateLimited(@PathVariable UUID apiKeyId) {
        boolean limited = rateLimitService.isRateLimited(apiKeyId);
        return ResponseEntity.ok(ApiResponse.ok(limited));
    }
}
