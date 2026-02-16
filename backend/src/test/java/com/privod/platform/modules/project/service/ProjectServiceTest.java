package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.audit.AuditService;
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
import com.privod.platform.modules.project.web.dto.ProjectMemberResponse;
import com.privod.platform.modules.project.web.dto.ProjectResponse;
import com.privod.platform.modules.project.web.dto.UpdateProjectRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProjectService projectService;

    private UUID projectId;
    private UUID organizationId;
    private UUID managerId;
    private Project testProject;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        organizationId = UUID.randomUUID();
        managerId = UUID.randomUUID();

        testProject = Project.builder()
                .code("PRJ-00001")
                .name("Test Project")
                .description("Test Description")
                .status(ProjectStatus.DRAFT)
                .organizationId(organizationId)
                .managerId(managerId)
                .plannedStartDate(LocalDate.of(2025, 1, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .budgetAmount(new BigDecimal("10000000.00"))
                .contractAmount(new BigDecimal("12000000.00"))
                .type(ProjectType.RESIDENTIAL)
                .priority(ProjectPriority.HIGH)
                .build();
        testProject.setId(projectId);
        testProject.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Project")
    class CreateProjectTests {

        @Test
        @DisplayName("Should create project with DRAFT status")
        void shouldCreateProject_withDraftStatus() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "New Project", "Description", organizationId, null, managerId,
                    LocalDate.of(2025, 3, 1), LocalDate.of(2025, 12, 31),
                    "Address", "Moscow", "Moscow Region", null, null,
                    new BigDecimal("5000000.00"), new BigDecimal("6000000.00"),
                    ProjectType.COMMERCIAL, "Office", ProjectPriority.HIGH);

            when(projectRepository.getNextCodeSequence()).thenReturn(2L);
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
                Project p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            ProjectResponse response = projectService.create(request);

            assertThat(response.status()).isEqualTo(ProjectStatus.DRAFT);
            assertThat(response.name()).isEqualTo("New Project");
            assertThat(response.code()).isEqualTo("PRJ-00002");
            verify(auditService).logCreate(eq("Project"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default priority to NORMAL when null")
        void shouldDefaultPriority_whenNull() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "No Priority Project", null, organizationId, null, managerId,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2025, 6, 30),
                    null, null, null, null, null, null, null,
                    null, null, null);

            when(projectRepository.getNextCodeSequence()).thenReturn(3L);
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
                Project p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            ProjectResponse response = projectService.create(request);

            assertThat(response.priority()).isEqualTo(ProjectPriority.NORMAL);
        }

        @Test
        @DisplayName("Should reject when end date is before start date")
        void shouldThrowException_whenEndDateBeforeStartDate() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "Bad Dates", null, organizationId, null, managerId,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1),
                    null, null, null, null, null, null, null,
                    null, null, null);

            assertThatThrownBy(() -> projectService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Planned end date must be after planned start date");
        }
    }

    @Nested
    @DisplayName("Find and Update Project")
    class FindAndUpdateTests {

        @Test
        @DisplayName("Should find project by ID")
        void shouldReturnProject_whenExists() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

            ProjectResponse response = projectService.findById(projectId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("PRJ-00001");
            assertThat(response.name()).isEqualTo("Test Project");
        }

        @Test
        @DisplayName("Should throw when project not found")
        void shouldThrowException_whenProjectNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(projectRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.findById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Project not found");
        }

        @Test
        @DisplayName("Should update project name and budget")
        void shouldUpdateProject_whenValidInput() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProjectRequest request = new UpdateProjectRequest(
                    "Updated Name", null, null, null, null,
                    null, null, null, null, null, null, null,
                    null, null, new BigDecimal("20000000.00"), null,
                    null, null, null);

            ProjectResponse response = projectService.update(projectId, request);

            assertThat(response.name()).isEqualTo("Updated Name");
            assertThat(response.budgetAmount()).isEqualByComparingTo(new BigDecimal("20000000.00"));
            verify(auditService).logUpdate(eq("Project"), eq(projectId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition DRAFT to PLANNING")
        void shouldTransition_fromDraftToPlanning() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.PLANNING, null);
            ProjectResponse response = projectService.updateStatus(projectId, request);

            assertThat(response.status()).isEqualTo(ProjectStatus.PLANNING);
            verify(auditService).logStatusChange("Project", projectId, "DRAFT", "PLANNING");
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.COMPLETED, null);

            assertThatThrownBy(() -> projectService.updateStatus(projectId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition project from DRAFT to COMPLETED");
        }
    }

    @Nested
    @DisplayName("Project Members")
    class MemberTests {

        @Test
        @DisplayName("Should add member to project")
        void shouldAddMember_whenNotAlreadyMember() {
            UUID userId = UUID.randomUUID();
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(
                    eq(projectId), eq(userId), any())).thenReturn(Optional.empty());
            when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> {
                ProjectMember m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            AddProjectMemberRequest request = new AddProjectMemberRequest(userId, "ENGINEER");
            ProjectMemberResponse response = projectService.addMember(projectId, request);

            assertThat(response).isNotNull();
            verify(auditService).logCreate(eq("ProjectMember"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate member with same role")
        void shouldThrowException_whenAlreadyMember() {
            UUID userId = UUID.randomUUID();
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(
                    eq(projectId), eq(userId), any()))
                    .thenReturn(Optional.of(new ProjectMember()));

            AddProjectMemberRequest request = new AddProjectMemberRequest(userId, "ENGINEER");

            assertThatThrownBy(() -> projectService.addMember(projectId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already a member");
        }
    }

    @Test
    @DisplayName("Should soft delete project")
    void shouldSoftDelete_whenValidId() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        projectService.delete(projectId);

        assertThat(testProject.isDeleted()).isTrue();
        verify(auditService).logDelete("Project", projectId);
    }

    @Test
    @DisplayName("Should return dashboard summary")
    void shouldReturnDashboard() {
        when(projectRepository.countActiveProjects()).thenReturn(10L);
        when(projectRepository.countByStatus()).thenReturn(List.of(
                new Object[]{ProjectStatus.IN_PROGRESS, 5L},
                new Object[]{ProjectStatus.DRAFT, 3L}
        ));
        when(projectRepository.sumBudgetAmount()).thenReturn(new BigDecimal("50000000.00"));
        when(projectRepository.sumContractAmount()).thenReturn(new BigDecimal("60000000.00"));

        ProjectDashboardResponse dashboard = projectService.getDashboard();

        assertThat(dashboard.totalProjects()).isEqualTo(10L);
        assertThat(dashboard.totalBudget()).isEqualByComparingTo(new BigDecimal("50000000.00"));
        assertThat(dashboard.totalContract()).isEqualByComparingTo(new BigDecimal("60000000.00"));
    }
}
