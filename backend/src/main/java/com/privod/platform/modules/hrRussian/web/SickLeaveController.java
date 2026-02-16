package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hrRussian.service.SickLeaveService;
import com.privod.platform.modules.hrRussian.web.dto.CreateSickLeaveRequest;
import com.privod.platform.modules.hrRussian.web.dto.SickLeaveResponse;
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
@RequestMapping("/api/hr-russian/sick-leaves")
@RequiredArgsConstructor
@Tag(name = "Sick Leaves", description = "Больничные листы (РФ)")
public class SickLeaveController {

    private final SickLeaveService sickLeaveService;

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get sick leaves by employee")
    public ResponseEntity<ApiResponse<List<SickLeaveResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        List<SickLeaveResponse> leaves = sickLeaveService.getByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sick leave by ID")
    public ResponseEntity<ApiResponse<SickLeaveResponse>> getById(@PathVariable UUID id) {
        SickLeaveResponse response = sickLeaveService.getSickLeave(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new sick leave")
    public ResponseEntity<ApiResponse<SickLeaveResponse>> create(
            @Valid @RequestBody CreateSickLeaveRequest request) {
        SickLeaveResponse response = sickLeaveService.createSickLeave(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Close a sick leave")
    public ResponseEntity<ApiResponse<SickLeaveResponse>> close(@PathVariable UUID id) {
        SickLeaveResponse response = sickLeaveService.closeSickLeave(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/open")
    @Operation(summary = "Get all open sick leaves")
    public ResponseEntity<ApiResponse<List<SickLeaveResponse>>> getOpenSickLeaves() {
        List<SickLeaveResponse> leaves = sickLeaveService.getOpenSickLeaves();
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }
}
