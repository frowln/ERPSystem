package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.service.VacationService;
import com.privod.platform.modules.hrRussian.web.dto.CreateVacationRequest;
import com.privod.platform.modules.hrRussian.web.dto.VacationResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr-russian/vacations")
@RequiredArgsConstructor
@Tag(name = "Vacations", description = "Отпуска (РФ)")
public class VacationController {

    private final VacationService vacationService;

    @GetMapping
    @Operation(summary = "List all vacations with pagination")
    public ResponseEntity<ApiResponse<PageResponse<VacationResponse>>> list(
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<VacationResponse> page = vacationService.listVacations(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get vacations by employee")
    public ResponseEntity<ApiResponse<List<VacationResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        List<VacationResponse> vacations = vacationService.getByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(vacations));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vacation by ID")
    public ResponseEntity<ApiResponse<VacationResponse>> getById(@PathVariable UUID id) {
        VacationResponse response = vacationService.getVacation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new vacation")
    public ResponseEntity<ApiResponse<VacationResponse>> create(
            @Valid @RequestBody CreateVacationRequest request) {
        VacationResponse response = vacationService.createVacation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Approve a vacation")
    public ResponseEntity<ApiResponse<VacationResponse>> approve(@PathVariable UUID id) {
        VacationResponse response = vacationService.approveVacation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Cancel a vacation")
    public ResponseEntity<ApiResponse<VacationResponse>> cancel(@PathVariable UUID id) {
        VacationResponse response = vacationService.cancelVacation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a vacation")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        vacationService.deleteVacation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
