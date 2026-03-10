package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hr.domain.CrewAssignment;
import com.privod.platform.modules.hr.repository.CrewAssignmentRepository;
import com.privod.platform.modules.hr.web.dto.CrewAssignmentResponse;
import com.privod.platform.modules.hr.web.dto.CreateCrewAssignmentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrewService {

    private final CrewAssignmentRepository crewAssignmentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<CrewAssignmentResponse> listAll(Pageable pageable) {
        Page<CrewAssignment> page = crewAssignmentRepository.findByActiveTrueAndDeletedFalse(pageable);
        Page<CrewAssignmentResponse> mapped = page.map(CrewAssignmentResponse::fromEntity);
        return PageResponse.of(mapped);
    }

    @Transactional
    public CrewAssignmentResponse assignToProject(CreateCrewAssignmentRequest request) {
        // Check if already assigned
        crewAssignmentRepository.findByEmployeeIdAndProjectIdAndActiveTrue(
                request.employeeId(), request.projectId()
        ).ifPresent(existing -> {
            throw new IllegalStateException(
                    "Сотрудник уже назначен на этот проект");
        });

        CrewAssignment assignment = CrewAssignment.builder()
                .employeeId(request.employeeId())
                .projectId(request.projectId())
                .role(request.role())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .hourlyRate(request.hourlyRate())
                .active(true)
                .build();

        assignment = crewAssignmentRepository.save(assignment);
        auditService.logCreate("CrewAssignment", assignment.getId());

        log.info("Employee {} assigned to project {} ({})",
                request.employeeId(), request.projectId(), assignment.getId());
        return CrewAssignmentResponse.fromEntity(assignment);
    }

    @Transactional
    public CrewAssignmentResponse removeFromProject(UUID employeeId, UUID projectId) {
        CrewAssignment assignment = crewAssignmentRepository
                .findByEmployeeIdAndProjectIdAndActiveTrue(employeeId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Назначение сотрудника на проект не найдено"));

        assignment.setActive(false);
        assignment = crewAssignmentRepository.save(assignment);
        auditService.logUpdate("CrewAssignment", assignment.getId(), "active", "true", "false");

        log.info("Employee {} removed from project {} ({})",
                employeeId, projectId, assignment.getId());
        return CrewAssignmentResponse.fromEntity(assignment);
    }

    @Transactional(readOnly = true)
    public List<CrewAssignmentResponse> getProjectCrew(UUID projectId) {
        return crewAssignmentRepository.findByProjectIdAndActiveTrue(projectId)
                .stream()
                .map(CrewAssignmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CrewAssignmentResponse> getEmployeeProjects(UUID employeeId) {
        return crewAssignmentRepository.findByEmployeeIdAndActiveTrue(employeeId)
                .stream()
                .map(CrewAssignmentResponse::fromEntity)
                .toList();
    }
}
