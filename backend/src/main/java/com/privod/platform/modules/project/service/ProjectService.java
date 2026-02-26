package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.notification.service.WebSocketNotificationService;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectMember;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.repository.ProjectMemberRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.project.web.dto.AddProjectMemberRequest;
import com.privod.platform.modules.project.web.dto.ChangeStatusRequest;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import com.privod.platform.modules.project.web.dto.ProjectDashboardResponse;
import com.privod.platform.modules.project.web.dto.ProjectFinancialSummary;
import com.privod.platform.modules.project.web.dto.ProjectMemberResponse;
import com.privod.platform.modules.project.web.dto.ProjectResponse;
import com.privod.platform.modules.project.web.dto.UpdateProjectRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AuditService auditService;
    private final WebSocketNotificationService wsNotificationService;
    private final ProjectFinancialService financialService;

    @Transactional(readOnly = true)
    public Page<ProjectResponse> findAll(String search, ProjectStatus status, ProjectType type,
                                          ProjectPriority priority, UUID organizationId,
                                          UUID managerId, String city, Pageable pageable) {
        UUID currentOrgId = requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access projects for another organization");
        }

        Specification<Project> spec = Specification.where(ProjectSpecification.notDeleted())
                .and(ProjectSpecification.hasStatus(status))
                .and(ProjectSpecification.hasType(type))
                .and(ProjectSpecification.hasPriority(priority))
                .and(ProjectSpecification.belongsToOrganization(currentOrgId))
                .and(ProjectSpecification.managedBy(managerId))
                .and(ProjectSpecification.searchByNameOrCode(search))
                .and(ProjectSpecification.inCity(city));

        return projectRepository.findAll(spec, pageable).map(ProjectResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id) {
        Project project = getProjectOrThrow(id);
        ProjectFinancialSummary financials = financialService.getFinancials(id);
        return ProjectResponse.fromEntityWithFinancials(project, financials);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        validateDates(request.plannedStartDate(), request.plannedEndDate());

        UUID currentOrgId = requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create a project in another organization");
        }

        Project project = createWithUniqueCode(request, currentOrgId);
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request) {
        Project project = getProjectOrThrow(id);
        UUID currentOrgId = requireCurrentOrganizationId();

        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot move a project to another organization");
        }

        if (request.name() != null) {
            project.setName(request.name());
        }
        if (request.description() != null) {
            project.setDescription(request.description());
        }
        if (request.customerId() != null) {
            project.setCustomerId(request.customerId());
        }
        if (request.managerId() != null) {
            project.setManagerId(request.managerId());
        }
        if (request.plannedStartDate() != null) {
            project.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            project.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            project.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            project.setActualEndDate(request.actualEndDate());
        }
        if (request.address() != null) {
            project.setAddress(request.address());
        }
        if (request.city() != null) {
            project.setCity(request.city());
        }
        if (request.region() != null) {
            project.setRegion(request.region());
        }
        if (request.latitude() != null) {
            project.setLatitude(request.latitude());
        }
        if (request.longitude() != null) {
            project.setLongitude(request.longitude());
        }
        if (request.budgetAmount() != null) {
            project.setBudgetAmount(request.budgetAmount());
        }
        if (request.contractAmount() != null) {
            project.setContractAmount(request.contractAmount());
        }
        if (request.type() != null) {
            project.setType(request.type());
        }
        if (request.category() != null) {
            project.setCategory(request.category());
        }
        if (request.constructionKind() != null) {
            project.setConstructionKind(request.constructionKind());
        }
        if (request.priority() != null) {
            project.setPriority(request.priority());
        }

        validateDates(project.getPlannedStartDate(), project.getPlannedEndDate());

        project = projectRepository.save(project);
        auditService.logUpdate("Project", project.getId(), "multiple", null, null);

        log.info("Project updated: {} ({})", project.getCode(), project.getId());
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse updateStatus(UUID id, ChangeStatusRequest request) {
        Project project = getProjectOrThrow(id);
        ProjectStatus oldStatus = project.getStatus();
        ProjectStatus newStatus = request.status();

        if (!project.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition project from %s to %s", oldStatus, newStatus));
        }

        project.setStatus(newStatus);

        if (newStatus == ProjectStatus.IN_PROGRESS && project.getActualStartDate() == null) {
            project.setActualStartDate(LocalDate.now());
        }
        if (newStatus == ProjectStatus.COMPLETED && project.getActualEndDate() == null) {
            project.setActualEndDate(LocalDate.now());
        }

        project = projectRepository.save(project);
        auditService.logStatusChange("Project", project.getId(), oldStatus.name(), newStatus.name());

        // Push real-time status change notification to project subscribers
        wsNotificationService.notifyStatusChange(
                project.getId(), "project", project.getId().toString(),
                project.getName(), oldStatus.name(), newStatus.name());

        log.info("Project status changed: {} from {} to {} ({})",
                project.getCode(), oldStatus, newStatus, project.getId());
        return ProjectResponse.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getMembers(UUID projectId) {
        getProjectOrThrow(projectId);
        return projectMemberRepository.findByProjectIdAndLeftAtIsNull(projectId)
                .stream()
                .map(ProjectMemberResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse addMember(UUID projectId, AddProjectMemberRequest request) {
        getProjectOrThrow(projectId);

        boolean alreadyMember = projectMemberRepository
                .findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(projectId, request.userId(), request.role())
                .isPresent();

        if (alreadyMember) {
            throw new IllegalArgumentException("User is already a member of this project with the specified role");
        }

        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(request.userId())
                .role(request.role())
                .joinedAt(Instant.now())
                .build();

        member = projectMemberRepository.save(member);
        auditService.logCreate("ProjectMember", member.getId());

        log.info("Member added to project {}: user={}, role={}", projectId, request.userId(), request.role());
        return ProjectMemberResponse.fromEntity(member);
    }

    @Transactional
    public void removeMember(UUID projectId, UUID memberId) {
        getProjectOrThrow(projectId);

        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("Project member not found: " + memberId));

        if (!member.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Member does not belong to this project");
        }

        member.setLeftAt(Instant.now());
        projectMemberRepository.save(member);
        auditService.logDelete("ProjectMember", memberId);

        log.info("Member removed from project {}: memberId={}", projectId, memberId);
    }

    @Transactional(readOnly = true)
    public ProjectDashboardResponse getDashboard() {
        UUID currentOrgId = requireCurrentOrganizationId();
        long totalProjects = projectRepository.countActiveProjectsByOrganizationId(currentOrgId);

        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = projectRepository.countByStatusAndOrganizationId(currentOrgId);
        for (Object[] row : statusData) {
            ProjectStatus status = (ProjectStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        // Manual (preliminary) totals from project entity fields
        BigDecimal totalBudget = projectRepository.sumBudgetAmountByOrganizationId(currentOrgId);
        BigDecimal totalContract = projectRepository.sumContractAmountByOrganizationId(currentOrgId);

        // Computed totals from linked financial documents
        List<UUID> activeProjectIds = projectRepository.findActiveProjectIdsByOrganizationId(currentOrgId);
        ProjectFinancialService.DashboardFinancialTotals computed =
                financialService.getDashboardTotals(activeProjectIds);

        return new ProjectDashboardResponse(
                totalProjects,
                statusCounts,
                totalBudget != null ? totalBudget : BigDecimal.ZERO,
                totalContract != null ? totalContract : BigDecimal.ZERO,
                computed.totalContractAmount(),
                computed.totalPlannedBudget(),
                computed.totalActualCost(),
                computed.totalCashFlow()
        );
    }

    @Transactional
    public void delete(UUID id) {
        Project project = getProjectOrThrow(id);
        project.softDelete();
        projectRepository.save(project);
        auditService.logDelete("Project", id);
        log.info("Project soft-deleted: {} ({})", project.getCode(), id);
    }

    private Project getProjectOrThrow(UUID id) {
        Project project = projectRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
        UUID currentOrgId = requireCurrentOrganizationId();

        // Strict tenant isolation: project must belong to the caller's organization.
        if (project.getOrganizationId() == null || !project.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Project not found with id: " + id);
        }

        return project;
    }

    private UUID requireCurrentOrganizationId() {
        return SecurityUtils.getCurrentOrganizationId()
                .orElseThrow(() -> new AccessDeniedException("Organization context is required"));
    }

    private String generateProjectCode() {
        return generateProjectCode("PRJ");
    }

    private String generateProjectCode(String prefix) {
        long seq = projectRepository.getNextCodeSequence();
        return String.format("%s-%05d", prefix, seq);
    }

    private Project createWithUniqueCode(CreateProjectRequest request, UUID organizationId) {
        final int maxAttempts = 10;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String code = attempt <= 5
                    ? generateProjectCode()
                    : generateProjectCode("PX");
            if (projectRepository.findByCode(code).isPresent()) {
                continue;
            }

            Project project = Project.builder()
                    .code(code)
                    .name(request.name())
                    .description(request.description())
                    .status(ProjectStatus.DRAFT)
                    .organizationId(organizationId)
                    .customerId(request.customerId())
                    .managerId(request.managerId())
                    .plannedStartDate(request.plannedStartDate())
                    .plannedEndDate(request.plannedEndDate())
                    .address(request.address())
                    .city(request.city())
                    .region(request.region())
                    .latitude(request.latitude())
                    .longitude(request.longitude())
                    .budgetAmount(request.budgetAmount())
                    .contractAmount(request.contractAmount())
                    .type(request.type())
                    .category(request.category())
                    .constructionKind(request.constructionKind())
                    .priority(request.priority() != null ? request.priority() : ProjectPriority.NORMAL)
                    .build();

            try {
                project = projectRepository.save(project);
                auditService.logCreate("Project", project.getId());
                log.info("Project created: {} - {} ({})", project.getCode(), project.getName(), project.getId());
                return project;
            } catch (DataIntegrityViolationException ex) {
                String msg = ex.getMostSpecificCause() != null
                        ? ex.getMostSpecificCause().getMessage()
                        : ex.getMessage();
                String safeMsg = msg == null ? "" : msg.toLowerCase(Locale.ROOT);
                if (!(safeMsg.contains("projects_code_key") || safeMsg.contains("idx_project_code") || safeMsg.contains("code"))) {
                    throw ex;
                }
                log.warn("Project code collision on attempt {} with code {}. Retrying.", attempt, code);
            }
        }
        throw new IllegalStateException("Could not generate unique project code after retries");
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Planned end date must be after planned start date");
        }
    }
}
