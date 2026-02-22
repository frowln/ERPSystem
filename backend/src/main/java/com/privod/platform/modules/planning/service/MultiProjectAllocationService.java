package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeCertificateRepository;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.planning.domain.MultiProjectAllocation;
import com.privod.platform.modules.planning.domain.MultiProjectResourceType;
import com.privod.platform.modules.planning.repository.MultiProjectAllocationRepository;
import com.privod.platform.modules.planning.web.dto.AllocationConflictResponse;
import com.privod.platform.modules.planning.web.dto.CreateMultiProjectAllocationRequest;
import com.privod.platform.modules.planning.web.dto.MultiProjectAllocationResponse;
import com.privod.platform.modules.planning.web.dto.ResourceSuggestionResponse;
import com.privod.platform.modules.planning.web.dto.UpdateMultiProjectAllocationRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MultiProjectAllocationService {

    private final MultiProjectAllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeCertificateRepository certificateRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MultiProjectAllocationResponse> getAllocations(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Page<MultiProjectAllocation> page = allocationRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable);

        Map<UUID, String> projectNames = resolveProjectNames(
                page.getContent().stream().map(MultiProjectAllocation::getProjectId).distinct().toList());
        Map<UUID, String> resourceNames = resolveResourceNames(page.getContent());

        return page.map(a -> MultiProjectAllocationResponse.fromEntity(a,
                resourceNames.getOrDefault(a.getResourceId(), "—"),
                projectNames.getOrDefault(a.getProjectId(), "—")));
    }

    @Transactional(readOnly = true)
    public List<MultiProjectAllocationResponse> getAllocationsByDateRange(LocalDate startDate,
                                                                          LocalDate endDate,
                                                                          List<UUID> projectIds,
                                                                          MultiProjectResourceType resourceType) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<MultiProjectAllocation> allocations = allocationRepository.findByDateRangeFiltered(
                orgId, startDate, endDate, resourceType, projectIds == null || projectIds.isEmpty() ? null : projectIds);

        Map<UUID, String> projectNames = resolveProjectNames(
                allocations.stream().map(MultiProjectAllocation::getProjectId).distinct().toList());
        Map<UUID, String> resourceNames = resolveResourceNames(allocations);

        return allocations.stream()
                .map(a -> MultiProjectAllocationResponse.fromEntity(a,
                        resourceNames.getOrDefault(a.getResourceId(), "—"),
                        projectNames.getOrDefault(a.getProjectId(), "—")))
                .toList();
    }

    @Transactional
    public MultiProjectAllocationResponse create(CreateMultiProjectAllocationRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateDates(request.startDate(), request.endDate());

        int percent = request.allocationPercent() != null ? request.allocationPercent() : 100;

        // Validate that total allocation does not exceed 100%
        validateNoConflict(request.resourceId(), request.startDate(), request.endDate(), percent, null);

        MultiProjectAllocation alloc = MultiProjectAllocation.builder()
                .organizationId(orgId)
                .resourceType(request.resourceType())
                .resourceId(request.resourceId())
                .projectId(request.projectId())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .allocationPercent(percent)
                .role(request.role())
                .notes(request.notes())
                .build();

        alloc = allocationRepository.save(alloc);
        auditService.logCreate("MultiProjectAllocation", alloc.getId());

        log.info("Мульти-проектное распределение создано: ресурс {} -> проект {} ({})",
                alloc.getResourceId(), alloc.getProjectId(), alloc.getId());

        String resourceName = resolveResourceName(alloc);
        String projectName = resolveProjectName(alloc.getProjectId());
        return MultiProjectAllocationResponse.fromEntity(alloc, resourceName, projectName);
    }

    @Transactional
    public MultiProjectAllocationResponse update(UUID id, UpdateMultiProjectAllocationRequest request) {
        MultiProjectAllocation alloc = getAllocationOrThrow(id);

        if (request.resourceType() != null) {
            alloc.setResourceType(request.resourceType());
        }
        if (request.resourceId() != null) {
            alloc.setResourceId(request.resourceId());
        }
        if (request.projectId() != null) {
            alloc.setProjectId(request.projectId());
        }
        if (request.startDate() != null) {
            alloc.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            alloc.setEndDate(request.endDate());
        }
        if (request.allocationPercent() != null) {
            alloc.setAllocationPercent(request.allocationPercent());
        }
        if (request.role() != null) {
            alloc.setRole(request.role());
        }
        if (request.notes() != null) {
            alloc.setNotes(request.notes());
        }

        validateDates(alloc.getStartDate(), alloc.getEndDate());
        validateNoConflict(alloc.getResourceId(), alloc.getStartDate(), alloc.getEndDate(),
                alloc.getAllocationPercent(), alloc.getId());

        alloc = allocationRepository.save(alloc);
        auditService.logUpdate("MultiProjectAllocation", alloc.getId(), "allocation", null, null);

        log.info("Мульти-проектное распределение обновлено: {}", alloc.getId());

        String resourceName = resolveResourceName(alloc);
        String projectName = resolveProjectName(alloc.getProjectId());
        return MultiProjectAllocationResponse.fromEntity(alloc, resourceName, projectName);
    }

    @Transactional
    public void delete(UUID id) {
        MultiProjectAllocation alloc = getAllocationOrThrow(id);
        alloc.softDelete();
        allocationRepository.save(alloc);
        auditService.logDelete("MultiProjectAllocation", id);
        log.info("Мульти-проектное распределение удалено: {}", id);
    }

    @Transactional(readOnly = true)
    public List<AllocationConflictResponse> detectConflicts(LocalDate startDate, LocalDate endDate) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<MultiProjectAllocation> allocations = allocationRepository.findAllForConflictDetection(
                orgId, startDate, endDate);

        // Group by resourceId
        Map<UUID, List<MultiProjectAllocation>> byResource = allocations.stream()
                .collect(Collectors.groupingBy(MultiProjectAllocation::getResourceId));

        List<AllocationConflictResponse> conflicts = new ArrayList<>();

        for (Map.Entry<UUID, List<MultiProjectAllocation>> entry : byResource.entrySet()) {
            List<MultiProjectAllocation> resourceAllocs = entry.getValue();
            if (resourceAllocs.size() < 2) {
                continue;
            }

            // Check each pair for overlaps exceeding 100%
            for (int i = 0; i < resourceAllocs.size(); i++) {
                for (int j = i + 1; j < resourceAllocs.size(); j++) {
                    MultiProjectAllocation a = resourceAllocs.get(i);
                    MultiProjectAllocation b = resourceAllocs.get(j);

                    LocalDate overlapStart = a.getStartDate().isAfter(b.getStartDate()) ? a.getStartDate() : b.getStartDate();
                    LocalDate overlapEnd = a.getEndDate().isBefore(b.getEndDate()) ? a.getEndDate() : b.getEndDate();

                    if (!overlapStart.isAfter(overlapEnd)) {
                        // Calculate total allocation for this resource in the overlap period
                        int totalPercent = 0;
                        List<AllocationConflictResponse.ConflictProject> conflictProjects = new ArrayList<>();
                        for (MultiProjectAllocation ra : resourceAllocs) {
                            if (!ra.getStartDate().isAfter(overlapEnd) && !ra.getEndDate().isBefore(overlapStart)) {
                                totalPercent += ra.getAllocationPercent();
                                String pName = resolveProjectName(ra.getProjectId());
                                if (conflictProjects.stream().noneMatch(cp -> cp.projectId().equals(ra.getProjectId()))) {
                                    conflictProjects.add(new AllocationConflictResponse.ConflictProject(
                                            ra.getProjectId(), pName, ra.getAllocationPercent()));
                                }
                            }
                        }

                        if (totalPercent > 100) {
                            String resourceName = resolveResourceName(a);
                            conflicts.add(new AllocationConflictResponse(
                                    entry.getKey(),
                                    resourceName,
                                    a.getResourceType(),
                                    conflictProjects,
                                    overlapStart,
                                    overlapEnd,
                                    totalPercent
                            ));
                            break; // Skip other pairs for same resource — already detected
                        }
                    }
                }
                if (conflicts.stream().anyMatch(c -> c.resourceId().equals(entry.getKey()))) {
                    break;
                }
            }
        }

        return conflicts;
    }

    @Transactional(readOnly = true)
    public List<ResourceSuggestionResponse> getResourceSuggestions(UUID projectId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate,
                                                                    List<String> skills) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Get all active employees in the organization
        List<Employee> employees = employeeRepository.findAllByOrganizationId(orgId).stream()
                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                .toList();

        // Get all allocations in the date range
        List<MultiProjectAllocation> existingAllocations = allocationRepository.findByDateRange(
                orgId, startDate, endDate);

        // Map allocations by resource ID
        Map<UUID, List<MultiProjectAllocation>> allocationsByResource = existingAllocations.stream()
                .collect(Collectors.groupingBy(MultiProjectAllocation::getResourceId));

        // Resolve project names for existing allocations
        Map<UUID, String> projectNames = resolveProjectNames(
                existingAllocations.stream().map(MultiProjectAllocation::getProjectId).distinct().toList());

        List<ResourceSuggestionResponse> suggestions = new ArrayList<>();

        for (Employee employee : employees) {
            // Get employee certificates
            List<EmployeeCertificate> certs = certificateRepository
                    .findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employee.getId());
            List<String> certNames = certs.stream()
                    .map(EmployeeCertificate::getName)
                    .toList();

            // If skills filter is provided, check if employee has matching certificates/position
            if (skills != null && !skills.isEmpty()) {
                boolean hasMatchingSkill = false;
                for (String skill : skills) {
                    String lowerSkill = skill.toLowerCase();
                    if (certNames.stream().anyMatch(c -> c.toLowerCase().contains(lowerSkill))) {
                        hasMatchingSkill = true;
                        break;
                    }
                    if (employee.getPosition() != null &&
                            employee.getPosition().toLowerCase().contains(lowerSkill)) {
                        hasMatchingSkill = true;
                        break;
                    }
                }
                if (!hasMatchingSkill) {
                    continue;
                }
            }

            // Calculate current allocation percent in the requested period
            List<MultiProjectAllocation> currentAllocs = allocationsByResource.getOrDefault(
                    employee.getId(), List.of());

            int totalAllocated = 0;
            List<ResourceSuggestionResponse.CurrentAllocationInfo> currentAllocInfos = new ArrayList<>();
            for (MultiProjectAllocation ca : currentAllocs) {
                if (!ca.getStartDate().isAfter(endDate) && !ca.getEndDate().isBefore(startDate)) {
                    totalAllocated += ca.getAllocationPercent();
                    currentAllocInfos.add(new ResourceSuggestionResponse.CurrentAllocationInfo(
                            ca.getProjectId(),
                            projectNames.getOrDefault(ca.getProjectId(), "—"),
                            ca.getAllocationPercent()
                    ));
                }
            }

            int availabilityPercent = Math.max(0, 100 - totalAllocated);
            if (availabilityPercent == 0) {
                continue; // Fully allocated, skip
            }

            List<String> skillsList = new ArrayList<>();
            if (employee.getPosition() != null) {
                skillsList.add(employee.getPosition());
            }

            String empName = employee.getFullName() != null ? employee.getFullName() :
                    (employee.getLastName() + " " + employee.getFirstName());
            suggestions.add(new ResourceSuggestionResponse(
                    employee.getId(),
                    empName,
                    employee.getPosition(),
                    skillsList,
                    certNames,
                    currentAllocInfos,
                    availabilityPercent
            ));
        }

        // Sort by availability descending (most available first)
        suggestions.sort((a, b) -> Integer.compare(b.availabilityPercent(), a.availabilityPercent()));

        return suggestions;
    }

    // --- Private helpers ---

    private MultiProjectAllocation getAllocationOrThrow(UUID id) {
        return allocationRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Мульти-проектное распределение не найдено: " + id));
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }

    private void validateNoConflict(UUID resourceId, LocalDate startDate, LocalDate endDate,
                                     int newPercent, UUID excludeId) {
        List<MultiProjectAllocation> overlapping = allocationRepository.findOverlappingAllocations(
                resourceId, startDate, endDate, excludeId);

        int totalExisting = overlapping.stream()
                .mapToInt(MultiProjectAllocation::getAllocationPercent)
                .sum();

        if (totalExisting + newPercent > 100) {
            throw new IllegalStateException(
                    String.format("Суммарное распределение ресурса превышает 100%%: текущее %d%% + новое %d%% = %d%%",
                            totalExisting, newPercent, totalExisting + newPercent));
        }
    }

    private Map<UUID, String> resolveProjectNames(List<UUID> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> result = new HashMap<>();
        projectRepository.findNamesByIds(projectIds).forEach(row ->
                result.put((UUID) row[0], (String) row[1]));
        return result;
    }

    private String resolveProjectName(UUID projectId) {
        if (projectId == null) return "—";
        Map<UUID, String> names = resolveProjectNames(List.of(projectId));
        return names.getOrDefault(projectId, "—");
    }

    private Map<UUID, String> resolveResourceNames(List<MultiProjectAllocation> allocations) {
        Map<UUID, String> result = new HashMap<>();
        List<UUID> workerIds = allocations.stream()
                .filter(a -> a.getResourceType() == MultiProjectResourceType.WORKER)
                .map(MultiProjectAllocation::getResourceId)
                .distinct()
                .toList();

        for (UUID wId : workerIds) {
            employeeRepository.findById(wId)
                    .filter(e -> !e.isDeleted())
                    .ifPresent(e -> result.put(wId,
                            e.getFullName() != null ? e.getFullName() :
                                    (e.getLastName() + " " + e.getFirstName())));
        }

        // For equipment, we could resolve from Vehicle repository. For now, store the ID as fallback.
        List<UUID> equipmentIds = allocations.stream()
                .filter(a -> a.getResourceType() == MultiProjectResourceType.EQUIPMENT)
                .map(MultiProjectAllocation::getResourceId)
                .distinct()
                .toList();

        for (UUID eId : equipmentIds) {
            if (!result.containsKey(eId)) {
                result.put(eId, "Техника: " + eId.toString().substring(0, 8));
            }
        }

        return result;
    }

    private String resolveResourceName(MultiProjectAllocation alloc) {
        if (alloc.getResourceType() == MultiProjectResourceType.WORKER) {
            return employeeRepository.findById(alloc.getResourceId())
                    .filter(e -> !e.isDeleted())
                    .map(e -> e.getFullName() != null ? e.getFullName() :
                            (e.getLastName() + " " + e.getFirstName()))
                    .orElse("—");
        }
        return "Техника: " + alloc.getResourceId().toString().substring(0, 8);
    }
}
