package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.admin.service.ModuleVisibilityService;
import com.privod.platform.modules.admin.web.dto.ModuleVisibilityResponse;
import com.privod.platform.modules.admin.web.dto.UpdateModuleVisibilityRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Module Visibility", description = "Manage which sidebar modules are visible")
public class ModuleVisibilityController {

    private final ModuleVisibilityService service;

    @GetMapping("/api/module-visibility")
    @Operation(summary = "Get disabled modules (any authenticated user)")
    public ResponseEntity<ApiResponse<ModuleVisibilityResponse>> getDisabledModules() {
        List<String> disabled = service.getDisabledModules();
        return ResponseEntity.ok(ApiResponse.ok(new ModuleVisibilityResponse(disabled)));
    }

    @PutMapping("/api/admin/module-visibility")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update disabled modules (admin only)")
    public ResponseEntity<ApiResponse<ModuleVisibilityResponse>> updateDisabledModules(
            @Valid @RequestBody UpdateModuleVisibilityRequest request) {
        List<String> disabled = service.updateDisabledModules(request.disabledModules());
        return ResponseEntity.ok(ApiResponse.ok(new ModuleVisibilityResponse(disabled)));
    }
}
