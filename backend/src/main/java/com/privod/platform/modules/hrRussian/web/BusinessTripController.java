package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hrRussian.service.BusinessTripService;
import com.privod.platform.modules.hrRussian.web.dto.BusinessTripResponse;
import com.privod.platform.modules.hrRussian.web.dto.CreateBusinessTripRequest;
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
@RequestMapping("/api/hr-russian/business-trips")
@RequiredArgsConstructor
@Tag(name = "Business Trips", description = "Командировки (РФ)")
public class BusinessTripController {

    private final BusinessTripService businessTripService;

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get business trips by employee")
    public ResponseEntity<ApiResponse<List<BusinessTripResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        List<BusinessTripResponse> trips = businessTripService.getByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(trips));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get business trip by ID")
    public ResponseEntity<ApiResponse<BusinessTripResponse>> getById(@PathVariable UUID id) {
        BusinessTripResponse response = businessTripService.getBusinessTrip(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new business trip")
    public ResponseEntity<ApiResponse<BusinessTripResponse>> create(
            @Valid @RequestBody CreateBusinessTripRequest request) {
        BusinessTripResponse response = businessTripService.createBusinessTrip(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Approve a business trip")
    public ResponseEntity<ApiResponse<BusinessTripResponse>> approve(@PathVariable UUID id) {
        BusinessTripResponse response = businessTripService.approveTrip(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Complete a business trip")
    public ResponseEntity<ApiResponse<BusinessTripResponse>> complete(@PathVariable UUID id) {
        BusinessTripResponse response = businessTripService.completeTrip(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active business trips")
    public ResponseEntity<ApiResponse<List<BusinessTripResponse>>> getActiveTrips() {
        List<BusinessTripResponse> trips = businessTripService.getActiveTrips();
        return ResponseEntity.ok(ApiResponse.ok(trips));
    }
}
