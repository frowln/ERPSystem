package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyPpeService;
import com.privod.platform.modules.safety.web.dto.CreatePpeIssueRequest;
import com.privod.platform.modules.safety.web.dto.PpeIssueResponse;
import com.privod.platform.modules.safety.web.dto.PpeItemResponse;
import com.privod.platform.modules.safety.web.dto.ReturnPpeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/safety/ppe")
@RequiredArgsConstructor
@Tag(name = "Safety PPE", description = "Personal protective equipment inventory and issuance")
public class SafetyPpeController {

    private final SafetyPpeService ppeService;

    @GetMapping("/inventory")
    @Operation(summary = "Get PPE inventory list")
    public ResponseEntity<ApiResponse<PageResponse<PpeItemResponse>>> listInventory(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PpeItemResponse> page = ppeService.listInventory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/issues")
    @Operation(summary = "Get PPE issuance records")
    public ResponseEntity<ApiResponse<PageResponse<PpeIssueResponse>>> listIssues(
            @RequestParam(required = false) UUID employeeId,
            @PageableDefault(size = 20, sort = "issuedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PpeIssueResponse> page = ppeService.listIssues(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/issues")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Issue PPE to employee")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> issuePpe(
            @Valid @RequestBody CreatePpeIssueRequest request) {
        PpeIssueResponse response = ppeService.issuePpe(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/issues/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Return PPE from employee")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> returnPpe(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnPpeRequest request) {
        PpeIssueResponse response = ppeService.returnPpe(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
