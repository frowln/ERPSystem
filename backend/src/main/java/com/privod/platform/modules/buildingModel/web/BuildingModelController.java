package com.privod.platform.modules.buildingModel.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.buildingModel.service.BuildingModelService;
import com.privod.platform.modules.buildingModel.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/building-model")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
@Tag(name = "Building Model", description = "Building spatial model: sections, floors, rooms, axes")
public class BuildingModelController {

    private final BuildingModelService buildingModelService;

    // ---- Full tree ----

    @GetMapping
    @Operation(summary = "Get full building model tree for a project")
    public ResponseEntity<ApiResponse<BuildingModelResponse>> getBuildingModel(
            @PathVariable UUID projectId) {
        BuildingModelResponse model = buildingModelService.getBuildingModel(projectId);
        return ResponseEntity.ok(ApiResponse.ok(model));
    }

    // ---- Sections ----

    @GetMapping("/sections")
    @Operation(summary = "List building sections")
    public ResponseEntity<ApiResponse<List<BuildingSectionResponse>>> listSections(
            @PathVariable UUID projectId) {
        List<BuildingSectionResponse> sections = buildingModelService.listSections(projectId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    @PostMapping("/sections")
    @Operation(summary = "Create a building section")
    public ResponseEntity<ApiResponse<BuildingSectionResponse>> createSection(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateBuildingSectionRequest request) {
        BuildingSectionResponse response = buildingModelService.createSection(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/sections/{id}")
    @Operation(summary = "Update a building section")
    public ResponseEntity<ApiResponse<BuildingSectionResponse>> updateSection(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuildingSectionRequest request) {
        BuildingSectionResponse response = buildingModelService.updateSection(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/sections/{id}")
    @Operation(summary = "Delete a building section (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteSection(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        buildingModelService.deleteSection(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Floors ----

    @GetMapping("/floors")
    @Operation(summary = "List building floors")
    public ResponseEntity<ApiResponse<List<BuildingFloorResponse>>> listFloors(
            @PathVariable UUID projectId) {
        List<BuildingFloorResponse> floors = buildingModelService.listFloors(projectId);
        return ResponseEntity.ok(ApiResponse.ok(floors));
    }

    @PostMapping("/floors")
    @Operation(summary = "Create a building floor")
    public ResponseEntity<ApiResponse<BuildingFloorResponse>> createFloor(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateBuildingFloorRequest request) {
        BuildingFloorResponse response = buildingModelService.createFloor(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/floors/{id}")
    @Operation(summary = "Update a building floor")
    public ResponseEntity<ApiResponse<BuildingFloorResponse>> updateFloor(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuildingFloorRequest request) {
        BuildingFloorResponse response = buildingModelService.updateFloor(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/floors/{id}")
    @Operation(summary = "Delete a building floor (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteFloor(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        buildingModelService.deleteFloor(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Rooms ----

    @GetMapping("/rooms")
    @Operation(summary = "List building rooms")
    public ResponseEntity<ApiResponse<List<BuildingRoomResponse>>> listRooms(
            @PathVariable UUID projectId) {
        List<BuildingRoomResponse> rooms = buildingModelService.listRooms(projectId);
        return ResponseEntity.ok(ApiResponse.ok(rooms));
    }

    @PostMapping("/rooms")
    @Operation(summary = "Create a building room")
    public ResponseEntity<ApiResponse<BuildingRoomResponse>> createRoom(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateBuildingRoomRequest request) {
        BuildingRoomResponse response = buildingModelService.createRoom(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/rooms/{id}")
    @Operation(summary = "Update a building room")
    public ResponseEntity<ApiResponse<BuildingRoomResponse>> updateRoom(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuildingRoomRequest request) {
        BuildingRoomResponse response = buildingModelService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/rooms/{id}")
    @Operation(summary = "Delete a building room (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        buildingModelService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Axes ----

    @GetMapping("/sections/{sectionId}/axes")
    @Operation(summary = "List building axes for a section")
    public ResponseEntity<ApiResponse<List<BuildingAxisResponse>>> listAxes(
            @PathVariable UUID projectId,
            @PathVariable UUID sectionId) {
        List<BuildingAxisResponse> axes = buildingModelService.listAxes(projectId, sectionId);
        return ResponseEntity.ok(ApiResponse.ok(axes));
    }

    @PostMapping("/axes")
    @Operation(summary = "Create a building axis")
    public ResponseEntity<ApiResponse<BuildingAxisResponse>> createAxis(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateBuildingAxisRequest request) {
        BuildingAxisResponse response = buildingModelService.createAxis(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/axes/{id}")
    @Operation(summary = "Update a building axis")
    public ResponseEntity<ApiResponse<BuildingAxisResponse>> updateAxis(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuildingAxisRequest request) {
        BuildingAxisResponse response = buildingModelService.updateAxis(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/axes/{id}")
    @Operation(summary = "Delete a building axis (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteAxis(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        buildingModelService.deleteAxis(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
