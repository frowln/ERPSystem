package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hr.service.EmployeeBulkImportService;
import com.privod.platform.modules.hr.web.dto.BulkImportResult;
import com.privod.platform.modules.hr.web.dto.EmployeeImportRow;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employee Bulk Import", description = "Bulk import employees from xlsx data")
public class EmployeeBulkImportController {

    private final EmployeeBulkImportService bulkImportService;

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Bulk import employees from parsed xlsx rows")
    public ResponseEntity<ApiResponse<BulkImportResult>> bulkImport(
            @RequestBody List<EmployeeImportRow> rows) {
        BulkImportResult result = bulkImportService.bulkImport(rows);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
