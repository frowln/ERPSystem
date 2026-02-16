package com.privod.platform.modules.monteCarlo.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.monteCarlo.domain.SimulationStatus;
import com.privod.platform.modules.monteCarlo.service.MonteCarloService;
import com.privod.platform.modules.monteCarlo.web.dto.CreateMonteCarloSimulationRequest;
import com.privod.platform.modules.monteCarlo.web.dto.CreateMonteCarloTaskRequest;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloResultResponse;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloSimulationResponse;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloTaskResponse;
import com.privod.platform.modules.monteCarlo.web.dto.UpdateMonteCarloSimulationRequest;
import com.privod.platform.modules.monteCarlo.web.dto.UpdateMonteCarloTaskRequest;
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
@RequestMapping("/api/monte-carlo")
@RequiredArgsConstructor
@Tag(name = "Monte Carlo", description = "Monte Carlo simulation management endpoints")
public class MonteCarloController {

    private final MonteCarloService monteCarloService;

    // ---- Simulation endpoints ----

    @GetMapping("/simulations")
    @Operation(summary = "List Monte Carlo simulations with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<MonteCarloSimulationResponse>>> listSimulations(
            @RequestParam(required = false) SimulationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MonteCarloSimulationResponse> page = monteCarloService.listSimulations(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/simulations/{id}")
    @Operation(summary = "Get Monte Carlo simulation by ID")
    public ResponseEntity<ApiResponse<MonteCarloSimulationResponse>> getSimulation(@PathVariable UUID id) {
        MonteCarloSimulationResponse response = monteCarloService.getSimulation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/simulations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PLANNER')")
    @Operation(summary = "Create a new Monte Carlo simulation")
    public ResponseEntity<ApiResponse<MonteCarloSimulationResponse>> createSimulation(
            @Valid @RequestBody CreateMonteCarloSimulationRequest request) {
        MonteCarloSimulationResponse response = monteCarloService.createSimulation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/simulations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PLANNER')")
    @Operation(summary = "Update an existing Monte Carlo simulation")
    public ResponseEntity<ApiResponse<MonteCarloSimulationResponse>> updateSimulation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMonteCarloSimulationRequest request) {
        MonteCarloSimulationResponse response = monteCarloService.updateSimulation(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/simulations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft-delete a Monte Carlo simulation")
    public ResponseEntity<ApiResponse<Void>> deleteSimulation(@PathVariable UUID id) {
        monteCarloService.deleteSimulation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Task endpoints ----

    @GetMapping("/simulations/{id}/tasks")
    @Operation(summary = "List tasks for a Monte Carlo simulation")
    public ResponseEntity<ApiResponse<List<MonteCarloTaskResponse>>> listTasks(
            @PathVariable UUID id) {
        List<MonteCarloTaskResponse> responses = monteCarloService.listTasks(id);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/simulations/{id}/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PLANNER')")
    @Operation(summary = "Add a task to a Monte Carlo simulation")
    public ResponseEntity<ApiResponse<MonteCarloTaskResponse>> addTask(
            @PathVariable UUID id,
            @Valid @RequestBody CreateMonteCarloTaskRequest request) {
        MonteCarloTaskResponse response = monteCarloService.addTask(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/simulations/{id}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PLANNER')")
    @Operation(summary = "Update a task in a Monte Carlo simulation")
    public ResponseEntity<ApiResponse<MonteCarloTaskResponse>> updateTask(
            @PathVariable UUID id,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateMonteCarloTaskRequest request) {
        MonteCarloTaskResponse response = monteCarloService.updateTask(id, taskId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/simulations/{id}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft-delete a task from a Monte Carlo simulation")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID id,
            @PathVariable UUID taskId) {
        monteCarloService.deleteTask(id, taskId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Run & Results endpoints ----

    @PostMapping("/simulations/{id}/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PLANNER')")
    @Operation(summary = "Run the Monte Carlo simulation using PERT analysis")
    public ResponseEntity<ApiResponse<MonteCarloSimulationResponse>> runSimulation(
            @PathVariable UUID id) {
        MonteCarloSimulationResponse response = monteCarloService.runSimulation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/simulations/{id}/results")
    @Operation(summary = "Get results of a completed Monte Carlo simulation")
    public ResponseEntity<ApiResponse<List<MonteCarloResultResponse>>> getResults(
            @PathVariable UUID id) {
        List<MonteCarloResultResponse> responses = monteCarloService.getResults(id);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
