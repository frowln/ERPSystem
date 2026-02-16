package com.privod.platform.modules.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.project.domain.ProjectMemberRole;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.service.ProjectService;
import com.privod.platform.modules.project.web.ProjectController;
import com.privod.platform.modules.project.web.dto.AddProjectMemberRequest;
import com.privod.platform.modules.project.web.dto.ChangeStatusRequest;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import com.privod.platform.modules.project.web.dto.ProjectDashboardResponse;
import com.privod.platform.modules.project.web.dto.ProjectMemberResponse;
import com.privod.platform.modules.project.web.dto.ProjectResponse;
import com.privod.platform.modules.project.web.dto.UpdateProjectRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID projectId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();

    private ProjectResponse buildProjectResponse() {
        return new ProjectResponse(
                projectId, "PRJ-00001", "Test Project", "Description",
                ProjectStatus.DRAFT, "Черновик",
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                null, null,
                "123 Main St", "Moscow", "Moscow Region",
                new BigDecimal("55.7558000"), new BigDecimal("37.6173000"),
                new BigDecimal("10000000.00"), new BigDecimal("12000000.00"),
                ProjectType.COMMERCIAL, "Office", ProjectPriority.HIGH,
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/projects - should return paginated projects")
    void listProjects() throws Exception {
        ProjectResponse response = buildProjectResponse();
        Page<ProjectResponse> page = new PageImpl<>(List.of(response));
        when(projectService.findAll(any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("PRJ-00001")))
                .andExpect(jsonPath("$.data.content[0].name", is("Test Project")))
                .andExpect(jsonPath("$.data.totalElements", is(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/projects/{id} - should return project by ID")
    void getProjectById() throws Exception {
        ProjectResponse response = buildProjectResponse();
        when(projectService.findById(projectId)).thenReturn(response);

        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(projectId.toString())))
                .andExpect(jsonPath("$.data.code", is("PRJ-00001")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.statusDisplayName", is("Черновик")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/projects/{id} - should return 404 when not found")
    void getProjectById_NotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(projectService.findById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Project not found"));

        mockMvc.perform(get("/api/projects/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is(404)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/projects - should create project")
    void createProject() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "New Project", "Description", null, null, null,
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 12, 31),
                null, "Moscow", null, null, null,
                new BigDecimal("5000000"), null,
                ProjectType.RESIDENTIAL, null, ProjectPriority.NORMAL);

        ProjectResponse response = buildProjectResponse();
        when(projectService.create(any(CreateProjectRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("PRJ-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/projects - should return 400 for invalid request")
    void createProject_ValidationFails() throws Exception {
        String invalidJson = """
                {
                    "name": "",
                    "budgetAmount": -100
                }
                """;

        mockMvc.perform(post("/api/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/projects/{id} - should update project")
    void updateProject() throws Exception {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Updated Name", null, null, null, null,
                null, null, null, null,
                null, null, null, null, null,
                null, null, null, null, null);

        ProjectResponse response = buildProjectResponse();
        when(projectService.update(eq(projectId), any(UpdateProjectRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/projects/{id}/status - should change status")
    void updateStatus() throws Exception {
        ChangeStatusRequest request = new ChangeStatusRequest(ProjectStatus.PLANNING, null);
        ProjectResponse response = buildProjectResponse();
        when(projectService.updateStatus(eq(projectId), any(ChangeStatusRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/projects/{id}/status", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/projects/{id} - should soft delete project")
    void deleteProject() throws Exception {
        doNothing().when(projectService).delete(projectId);

        mockMvc.perform(delete("/api/projects/{id}", projectId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/projects/{id}/members - should return project members")
    void getProjectMembers() throws Exception {
        ProjectMemberResponse memberResponse = new ProjectMemberResponse(
                memberId, projectId, UUID.randomUUID(),
                ProjectMemberRole.ENGINEER, Instant.now(), null);

        when(projectService.getMembers(projectId)).thenReturn(List.of(memberResponse));

        mockMvc.perform(get("/api/projects/{id}/members", projectId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].role", is("ENGINEER")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/projects/{id}/members - should add member")
    void addProjectMember() throws Exception {
        UUID userId = UUID.randomUUID();
        AddProjectMemberRequest request = new AddProjectMemberRequest(userId, ProjectMemberRole.FOREMAN);

        ProjectMemberResponse response = new ProjectMemberResponse(
                memberId, projectId, userId, ProjectMemberRole.FOREMAN, Instant.now(), null);
        when(projectService.addMember(eq(projectId), any(AddProjectMemberRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/projects/{id}/members", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.role", is("FOREMAN")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/projects/{id}/members/{memberId} - should remove member")
    void removeProjectMember() throws Exception {
        doNothing().when(projectService).removeMember(projectId, memberId);

        mockMvc.perform(delete("/api/projects/{id}/members/{memberId}", projectId, memberId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/projects/dashboard/summary - should return dashboard stats")
    void getDashboard() throws Exception {
        ProjectDashboardResponse dashboard = new ProjectDashboardResponse(
                15L,
                Map.of("DRAFT", 3L, "IN_PROGRESS", 8L, "COMPLETED", 4L),
                new BigDecimal("150000000.00"),
                new BigDecimal("180000000.00")
        );
        when(projectService.getDashboard()).thenReturn(dashboard);

        mockMvc.perform(get("/api/projects/dashboard/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalProjects", is(15)))
                .andExpect(jsonPath("$.data.statusCounts.DRAFT", is(3)))
                .andExpect(jsonPath("$.data.statusCounts.IN_PROGRESS", is(8)));
    }
}
