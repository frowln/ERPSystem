package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.ValueEngineeringService;
import com.privod.platform.modules.finance.web.dto.UpdateVeItemRequest;
import com.privod.platform.modules.finance.web.dto.VeItemResponse;
import com.privod.platform.modules.specification.web.dto.CreateVeProposalRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/value-engineering")
@RequiredArgsConstructor
@Tag(name = "Value Engineering", description = "Value Engineering proposals per project")
public class ValueEngineeringController {

    private final ValueEngineeringService valueEngineeringService;

    @GetMapping
    @Operation(summary = "Get all VE items for a project")
    public ResponseEntity<ApiResponse<List<VeItemResponse>>> list(@PathVariable UUID projectId) {
        List<VeItemResponse> items = valueEngineeringService.listByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new VE proposal for a project")
    public ResponseEntity<ApiResponse<VeItemResponse>> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateVeProposalRequest request) {
        VeItemResponse response = valueEngineeringService.create(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a VE item")
    public ResponseEntity<ApiResponse<VeItemResponse>> update(
            @PathVariable UUID projectId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateVeItemRequest request) {
        VeItemResponse response = valueEngineeringService.update(projectId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
