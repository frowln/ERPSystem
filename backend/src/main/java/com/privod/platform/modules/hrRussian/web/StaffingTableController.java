package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.service.StaffingTableService;
import com.privod.platform.modules.hrRussian.web.dto.CreateStaffingTableRequest;
import com.privod.platform.modules.hrRussian.web.dto.StaffingTableResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr-russian/staffing-table")
@RequiredArgsConstructor
@Tag(name = "Staffing Table", description = "Штатное расписание (РФ)")
public class StaffingTableController {

    private final StaffingTableService staffingTableService;

    @GetMapping
    @Operation(summary = "List active staffing positions with pagination")
    public ResponseEntity<ApiResponse<PageResponse<StaffingTableResponse>>> list(
            @PageableDefault(size = 20, sort = "positionName", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<StaffingTableResponse> page = staffingTableService.listActivePositions(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/vacancies")
    @Operation(summary = "Get vacant positions")
    public ResponseEntity<ApiResponse<List<StaffingTableResponse>>> getVacancies() {
        List<StaffingTableResponse> vacancies = staffingTableService.getVacantPositions();
        return ResponseEntity.ok(ApiResponse.ok(vacancies));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new staffing table position")
    public ResponseEntity<ApiResponse<StaffingTableResponse>> create(
            @Valid @RequestBody CreateStaffingTableRequest request) {
        StaffingTableResponse response = staffingTableService.createPosition(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a staffing table position")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        staffingTableService.deletePosition(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
