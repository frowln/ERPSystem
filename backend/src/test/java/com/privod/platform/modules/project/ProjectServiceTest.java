package com.privod.platform.modules.project;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectMember;
import com.privod.platform.modules.project.domain.ProjectMemberRole;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.repository.ProjectMemberRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.project.service.ProjectService;
import com.privod.platform.modules.project.web.dto.AddProjectMemberRequest;
import com.privod.platform.modules.project.web.dto.ChangeStatusRequest;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import com.privod.platform.modules.project.web.dto.ProjectMemberResponse;
import com.privod.platform.modules.project.web.dto.ProjectResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.never;
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
    private Project testProject;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        testProject = Project.builder()
                .code("PRJ-00001")
                .name("Test Project")
                .description("A test construction project")
                .status(ProjectStatus.DRAFT)
                .organizationId(UUID.randomUUID())
                .managerId(UUID.randomUUID())
                .plannedStartDate(LocalDate.of(2025, 1, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .budgetAmount(new BigDecimal("10000000.00"))
                .type(ProjectType.COMMERCIAL)
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
        void create_SetsDefaultDraftStatus() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "New Project", "Description", null, null, null,
                    LocalDate.of(2025, 3, 1), LocalDate.of(2025, 12, 31),
                    null, "Moscow", null, null, null,
                    new BigDecimal("5000000"), null,
                    ProjectType.RESIDENTIAL, null, ProjectPriority.NORMAL);

            when(projectRepository.getNextCodeSequence()).thenReturn(1L);
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
                Project p = invocation.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            ProjectResponse response = projectService.create(request);

            assertThat(response.status()).isEqualTo(ProjectStatus.DRAFT);
            assertThat(response.code()).isEqualTo("PRJ-00001");
            assertThat(response.name()).isEqualTo("New Project");
            verify(auditService).logCreate(eq("Project"), any(UUID.class));
        }

        @Test
        @DisplayName("Should fail when end date is before start date")
        void create_InvalidDates() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "Bad Dates Project", null, null, null, null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1),
                    null, null, null, null, null,
                    null, null, null, null, null);

            assertThatThrownBy(() -> projectService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("end date must be after");
        }
    }

    @Nested
    @DisplayName("Update Status")
    class UpdateStatusTests {

        @Test
        @DisplayName("Should allow valid status transition DRAFT -> PLANNING")
        void updateStatus_ValidTransition() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectRepository.save(any(Project.class))).thenReturn(testProject);

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.PLANNING, null);
            ProjectResponse response = projectService.updateStatus(projectId, request);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("Project", projectId, "DRAFT", "PLANNING");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> COMPLETED")
        void updateStatus_InvalidTransition() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.COMPLETED, null);

            assertThatThrownBy(() -> projectService.updateStatus(projectId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition");
        }

        @Test
        @DisplayName("Should set actual start date when moving to IN_PROGRESS")
        void updateStatus_SetsActualStartDate() {
            testProject.setStatus(ProjectStatus.PLANNING);
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.IN_PROGRESS, null);
            projectService.updateStatus(projectId, request);

            ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
            verify(projectRepository).save(captor.capture());
            assertThat(captor.getValue().getActualStartDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should throw when project not found")
        void updateStatus_ProjectNotFound() {
            when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

            ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.PLANNING, null);

            assertThatThrownBy(() -> projectService.updateStatus(projectId, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Project Members")
    class MemberTests {

        @Test
        @DisplayName("Should add member to project")
        void addMember_Success() {
            UUID userId = UUID.randomUUID();
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(
                    projectId, userId, ProjectMemberRole.ENGINEER))
                    .thenReturn(Optional.empty());
            when(projectMemberRepository.save(any(ProjectMember.class)))
                    .thenAnswer(invocation -> {
                        ProjectMember m = invocation.getArgument(0);
                        m.setId(UUID.randomUUID());
                        return m;
                    });

            AddProjectMemberRequest request = new AddProjectMemberRequest(userId, ProjectMemberRole.ENGINEER);
            ProjectMemberResponse response = projectService.addMember(projectId, request);

            assertThat(response).isNotNull();
            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.role()).isEqualTo(ProjectMemberRole.ENGINEER);
        }

        @Test
        @DisplayName("Should reject duplicate member with same role")
        void addMember_Duplicate() {
            UUID userId = UUID.randomUUID();
            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findByProjectIdAndUserIdAndRoleAndLeftAtIsNull(
                    projectId, userId, ProjectMemberRole.ENGINEER))
                    .thenReturn(Optional.of(ProjectMember.builder().build()));

            AddProjectMemberRequest request = new AddProjectMemberRequest(userId, ProjectMemberRole.ENGINEER);

            assertThatThrownBy(() -> projectService.addMember(projectId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already a member");
        }

        @Test
        @DisplayName("Should remove member by setting leftAt timestamp")
        void removeMember_Success() {
            UUID memberId = UUID.randomUUID();
            ProjectMember member = ProjectMember.builder()
                    .projectId(projectId)
                    .userId(UUID.randomUUID())
                    .role(ProjectMemberRole.FOREMAN)
                    .joinedAt(Instant.now())
                    .build();
            member.setId(memberId);

            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findById(memberId)).thenReturn(Optional.of(member));

            projectService.removeMember(projectId, memberId);

            assertThat(member.getLeftAt()).isNotNull();
            verify(projectMemberRepository).save(member);
        }

        @Test
        @DisplayName("Should get active members list")
        void getMembers_ReturnsActiveOnly() {
            ProjectMember activeMember = ProjectMember.builder()
                    .projectId(projectId)
                    .userId(UUID.randomUUID())
                    .role(ProjectMemberRole.MANAGER)
                    .joinedAt(Instant.now())
                    .build();
            activeMember.setId(UUID.randomUUID());

            when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
            when(projectMemberRepository.findByProjectIdAndLeftAtIsNull(projectId))
                    .thenReturn(List.of(activeMember));

            List<ProjectMemberResponse> members = projectService.getMembers(projectId);

            assertThat(members).hasSize(1);
            assertThat(members.get(0).role()).isEqualTo(ProjectMemberRole.MANAGER);
        }
    }

    @Test
    @DisplayName("Should find project by ID")
    void findById_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

        ProjectResponse response = projectService.findById(projectId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("PRJ-00001");
        assertThat(response.name()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Should throw when project not found by ID")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(projectRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Should soft delete project")
    void delete_SoftDeletes() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        projectService.delete(projectId);

        assertThat(testProject.isDeleted()).isTrue();
        verify(projectRepository).save(testProject);
        verify(auditService).logDelete("Project", projectId);
    }
}
