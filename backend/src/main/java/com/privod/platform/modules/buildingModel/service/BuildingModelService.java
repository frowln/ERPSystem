package com.privod.platform.modules.buildingModel.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.buildingModel.domain.BuildingAxis;
import com.privod.platform.modules.buildingModel.domain.BuildingFloor;
import com.privod.platform.modules.buildingModel.domain.BuildingRoom;
import com.privod.platform.modules.buildingModel.domain.BuildingSection;
import com.privod.platform.modules.buildingModel.repository.BuildingAxisRepository;
import com.privod.platform.modules.buildingModel.repository.BuildingFloorRepository;
import com.privod.platform.modules.buildingModel.repository.BuildingRoomRepository;
import com.privod.platform.modules.buildingModel.repository.BuildingSectionRepository;
import com.privod.platform.modules.buildingModel.web.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildingModelService {

    private final BuildingSectionRepository sectionRepository;
    private final BuildingFloorRepository floorRepository;
    private final BuildingRoomRepository roomRepository;
    private final BuildingAxisRepository axisRepository;

    // ---- Full tree ----

    @Transactional(readOnly = true)
    public BuildingModelResponse getBuildingModel(UUID projectId) {
        List<BuildingSection> sections = sectionRepository
                .findByProjectIdAndDeletedFalseOrderBySectionOrderAsc(projectId);

        List<BuildingSectionResponse> sectionResponses = sections.stream().map(section -> {
            List<BuildingFloor> floors = floorRepository
                    .findBySectionIdAndDeletedFalseOrderByFloorNumberAsc(section.getId());

            List<BuildingFloorResponse> floorResponses = floors.stream().map(floor -> {
                List<BuildingRoom> rooms = roomRepository
                        .findByFloorIdAndDeletedFalseOrderByRoomNumberAsc(floor.getId());
                List<BuildingRoomResponse> roomResponses = rooms.stream()
                        .map(BuildingRoomResponse::fromEntity)
                        .toList();
                return BuildingFloorResponse.fromEntity(floor, roomResponses);
            }).toList();

            List<BuildingAxis> axes = axisRepository
                    .findBySectionIdAndDeletedFalseOrderByNameAsc(section.getId());
            List<BuildingAxisResponse> axisResponses = axes.stream()
                    .map(BuildingAxisResponse::fromEntity)
                    .toList();

            return BuildingSectionResponse.fromEntity(section, floorResponses, axisResponses);
        }).toList();

        return new BuildingModelResponse(projectId, sectionResponses);
    }

    // ---- Sections CRUD ----

    @Transactional(readOnly = true)
    public List<BuildingSectionResponse> listSections(UUID projectId) {
        return sectionRepository.findByProjectIdAndDeletedFalseOrderBySectionOrderAsc(projectId)
                .stream()
                .map(BuildingSectionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BuildingSectionResponse createSection(UUID projectId, CreateBuildingSectionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BuildingSection section = BuildingSection.builder()
                .projectId(projectId)
                .organizationId(orgId)
                .name(request.name())
                .code(request.code())
                .sectionOrder(request.sectionOrder() != null ? request.sectionOrder() : 0)
                .floorCount(request.floorCount())
                .description(request.description())
                .build();
        section = sectionRepository.save(section);
        log.info("Created building section '{}' for project {}", section.getName(), projectId);
        return BuildingSectionResponse.fromEntity(section);
    }

    @Transactional
    public BuildingSectionResponse updateSection(UUID id, UpdateBuildingSectionRequest request) {
        BuildingSection section = sectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building section not found: " + id));
        if (request.name() != null) section.setName(request.name());
        if (request.code() != null) section.setCode(request.code());
        if (request.sectionOrder() != null) section.setSectionOrder(request.sectionOrder());
        if (request.floorCount() != null) section.setFloorCount(request.floorCount());
        if (request.description() != null) section.setDescription(request.description());
        section = sectionRepository.save(section);
        log.info("Updated building section '{}' ({})", section.getName(), id);
        return BuildingSectionResponse.fromEntity(section);
    }

    @Transactional
    public void deleteSection(UUID id) {
        BuildingSection section = sectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building section not found: " + id));
        section.softDelete();
        sectionRepository.save(section);
        log.info("Deleted building section '{}' ({})", section.getName(), id);
    }

    // ---- Floors CRUD ----

    @Transactional(readOnly = true)
    public List<BuildingFloorResponse> listFloors(UUID projectId) {
        return floorRepository.findByProjectIdAndDeletedFalse(projectId)
                .stream()
                .map(BuildingFloorResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BuildingFloorResponse createFloor(UUID projectId, CreateBuildingFloorRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BuildingFloor floor = BuildingFloor.builder()
                .sectionId(request.sectionId())
                .projectId(projectId)
                .organizationId(orgId)
                .name(request.name())
                .floorNumber(request.floorNumber())
                .elevation(request.elevation())
                .area(request.area())
                .build();
        floor = floorRepository.save(floor);
        log.info("Created building floor '{}' for project {}", floor.getName(), projectId);
        return BuildingFloorResponse.fromEntity(floor);
    }

    @Transactional
    public BuildingFloorResponse updateFloor(UUID id, UpdateBuildingFloorRequest request) {
        BuildingFloor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building floor not found: " + id));
        if (request.name() != null) floor.setName(request.name());
        if (request.floorNumber() != null) floor.setFloorNumber(request.floorNumber());
        if (request.elevation() != null) floor.setElevation(request.elevation());
        if (request.area() != null) floor.setArea(request.area());
        floor = floorRepository.save(floor);
        log.info("Updated building floor '{}' ({})", floor.getName(), id);
        return BuildingFloorResponse.fromEntity(floor);
    }

    @Transactional
    public void deleteFloor(UUID id) {
        BuildingFloor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building floor not found: " + id));
        floor.softDelete();
        floorRepository.save(floor);
        log.info("Deleted building floor '{}' ({})", floor.getName(), id);
    }

    // ---- Rooms CRUD ----

    @Transactional(readOnly = true)
    public List<BuildingRoomResponse> listRooms(UUID projectId) {
        return roomRepository.findByProjectIdAndDeletedFalse(projectId)
                .stream()
                .map(BuildingRoomResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BuildingRoomResponse createRoom(UUID projectId, CreateBuildingRoomRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BuildingRoom room = BuildingRoom.builder()
                .floorId(request.floorId())
                .projectId(projectId)
                .organizationId(orgId)
                .name(request.name())
                .roomNumber(request.roomNumber())
                .roomType(request.roomType())
                .area(request.area())
                .description(request.description())
                .build();
        room = roomRepository.save(room);
        log.info("Created building room '{}' for project {}", room.getName(), projectId);
        return BuildingRoomResponse.fromEntity(room);
    }

    @Transactional
    public BuildingRoomResponse updateRoom(UUID id, UpdateBuildingRoomRequest request) {
        BuildingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building room not found: " + id));
        if (request.name() != null) room.setName(request.name());
        if (request.roomNumber() != null) room.setRoomNumber(request.roomNumber());
        if (request.roomType() != null) room.setRoomType(request.roomType());
        if (request.area() != null) room.setArea(request.area());
        if (request.description() != null) room.setDescription(request.description());
        room = roomRepository.save(room);
        log.info("Updated building room '{}' ({})", room.getName(), id);
        return BuildingRoomResponse.fromEntity(room);
    }

    @Transactional
    public void deleteRoom(UUID id) {
        BuildingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building room not found: " + id));
        room.softDelete();
        roomRepository.save(room);
        log.info("Deleted building room '{}' ({})", room.getName(), id);
    }

    // ---- Axes CRUD ----

    @Transactional(readOnly = true)
    public List<BuildingAxisResponse> listAxes(UUID projectId, UUID sectionId) {
        return axisRepository.findBySectionIdAndDeletedFalseOrderByNameAsc(sectionId)
                .stream()
                .map(BuildingAxisResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BuildingAxisResponse createAxis(UUID projectId, CreateBuildingAxisRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BuildingAxis axis = BuildingAxis.builder()
                .sectionId(request.sectionId())
                .projectId(projectId)
                .organizationId(orgId)
                .axisType(request.axisType())
                .name(request.name())
                .position(request.position())
                .build();
        axis = axisRepository.save(axis);
        log.info("Created building axis '{}' for project {}", axis.getName(), projectId);
        return BuildingAxisResponse.fromEntity(axis);
    }

    @Transactional
    public BuildingAxisResponse updateAxis(UUID id, UpdateBuildingAxisRequest request) {
        BuildingAxis axis = axisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building axis not found: " + id));
        if (request.axisType() != null) axis.setAxisType(request.axisType());
        if (request.name() != null) axis.setName(request.name());
        if (request.position() != null) axis.setPosition(request.position());
        axis = axisRepository.save(axis);
        log.info("Updated building axis '{}' ({})", axis.getName(), id);
        return BuildingAxisResponse.fromEntity(axis);
    }

    @Transactional
    public void deleteAxis(UUID id) {
        BuildingAxis axis = axisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building axis not found: " + id));
        axis.softDelete();
        axisRepository.save(axis);
        log.info("Deleted building axis '{}' ({})", axis.getName(), id);
    }
}
