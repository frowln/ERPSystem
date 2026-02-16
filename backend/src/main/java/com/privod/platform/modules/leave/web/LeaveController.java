package com.privod.platform.modules.leave.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.leave.domain.LeaveRequestStatus;
import com.privod.platform.modules.leave.service.LeaveService;
import com.privod.platform.modules.leave.web.dto.CreateLeaveAllocationRequest;
import com.privod.platform.modules.leave.web.dto.CreateLeaveRequestRequest;
import com.privod.platform.modules.leave.web.dto.CreateLeaveTypeRequest;
import com.privod.platform.modules.leave.web.dto.LeaveAllocationResponse;
import com.privod.platform.modules.leave.web.dto.LeaveRequestResponse;
import com.privod.platform.modules.leave.web.dto.LeaveTypeResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leave")
@RequiredArgsConstructor
@Tag(name = "Leave Management", description = "Leave management endpoints")
public class LeaveController {

    private final LeaveService leaveService;

    // ---- Leave Types ----

    @GetMapping("/types")
    @Operation(summary = "List leave types")
    public ResponseEntity<ApiResponse<List<LeaveTypeResponse>>> listLeaveTypes(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<LeaveTypeResponse> types = leaveService.listLeaveTypes(activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(types));
    }

    @GetMapping("/types/{id}")
    @Operation(summary = "Get leave type by ID")
    public ResponseEntity<ApiResponse<LeaveTypeResponse>> getLeaveType(@PathVariable UUID id) {
        LeaveTypeResponse response = leaveService.getLeaveType(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/types")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new leave type")
    public ResponseEntity<ApiResponse<LeaveTypeResponse>> createLeaveType(
            @Valid @RequestBody CreateLeaveTypeRequest request) {
        LeaveTypeResponse response = leaveService.createLeaveType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/types/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a leave type")
    public ResponseEntity<ApiResponse<Void>> deleteLeaveType(@PathVariable UUID id) {
        leaveService.deleteLeaveType(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Leave Requests ----

    @GetMapping("/requests")
    @Operation(summary = "List leave requests with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<LeaveRequestResponse>>> listLeaveRequests(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) LeaveRequestStatus status,
            @RequestParam(required = false) UUID approverId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<LeaveRequestResponse> page = leaveService.listLeaveRequests(employeeId, status, approverId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get leave request by ID")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> getLeaveRequest(@PathVariable UUID id) {
        LeaveRequestResponse response = leaveService.getLeaveRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/requests")
    @Operation(summary = "Create a new leave request")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequestRequest request) {
        LeaveRequestResponse response = leaveService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/requests/{id}/submit")
    @Operation(summary = "Submit a leave request for approval")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> submitLeaveRequest(@PathVariable UUID id) {
        LeaveRequestResponse response = leaveService.submitLeaveRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve a leave request")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> approveLeaveRequest(
            @PathVariable UUID id,
            @RequestParam UUID approverId) {
        LeaveRequestResponse response = leaveService.approveLeaveRequest(id, approverId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/requests/{id}/refuse")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Refuse a leave request")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> refuseLeaveRequest(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @RequestParam(required = false) String reason) {
        LeaveRequestResponse response = leaveService.refuseLeaveRequest(id, approverId, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/requests/{id}/cancel")
    @Operation(summary = "Cancel a leave request")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> cancelLeaveRequest(@PathVariable UUID id) {
        LeaveRequestResponse response = leaveService.cancelLeaveRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Leave Balances (alias for allocations) ----

    @GetMapping("/balances")
    @Operation(summary = "List leave balances (allocations) with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<LeaveAllocationResponse>>> listBalances(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(defaultValue = "0") int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<LeaveAllocationResponse> page = leaveService.listAllocations(employeeId, year, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Leave Allocations ----

    @GetMapping("/allocations")
    @Operation(summary = "List leave allocations with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<LeaveAllocationResponse>>> listAllocations(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(defaultValue = "0") int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<LeaveAllocationResponse> page = leaveService.listAllocations(employeeId, year, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/allocations/{id}")
    @Operation(summary = "Get leave allocation by ID")
    public ResponseEntity<ApiResponse<LeaveAllocationResponse>> getAllocation(@PathVariable UUID id) {
        LeaveAllocationResponse response = leaveService.getAllocation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/allocations/employee/{employeeId}")
    @Operation(summary = "Get leave allocations for an employee in a given year")
    public ResponseEntity<ApiResponse<List<LeaveAllocationResponse>>> getEmployeeAllocations(
            @PathVariable UUID employeeId,
            @RequestParam int year) {
        List<LeaveAllocationResponse> allocations = leaveService.getEmployeeAllocations(employeeId, year);
        return ResponseEntity.ok(ApiResponse.ok(allocations));
    }

    @PostMapping("/allocations")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new leave allocation")
    public ResponseEntity<ApiResponse<LeaveAllocationResponse>> createAllocation(
            @Valid @RequestBody CreateLeaveAllocationRequest request) {
        LeaveAllocationResponse response = leaveService.createAllocation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/allocations/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Approve a leave allocation")
    public ResponseEntity<ApiResponse<LeaveAllocationResponse>> approveAllocation(@PathVariable UUID id) {
        LeaveAllocationResponse response = leaveService.approveAllocation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/allocations/{id}/refuse")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Refuse a leave allocation")
    public ResponseEntity<ApiResponse<LeaveAllocationResponse>> refuseAllocation(@PathVariable UUID id) {
        LeaveAllocationResponse response = leaveService.refuseAllocation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
