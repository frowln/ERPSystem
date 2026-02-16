package com.privod.platform.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditLog;
import com.privod.platform.infrastructure.audit.AuditLogRepository;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.web.dto.ChangeStatusRequest;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class ProjectIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("privod_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private String adminToken;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByEmail("admin@privod.ru")
                .orElseThrow(() -> new RuntimeException("Admin user not found - migration may have failed"));

        CustomUserDetails userDetails = new CustomUserDetails(admin);
        adminToken = jwtTokenProvider.generateToken(userDetails);
    }

    @Test
    @DisplayName("Full project lifecycle: create, list, update status, verify audit log")
    void projectLifecycle() throws Exception {
        // 1. Create a project
        CreateProjectRequest createRequest = new CreateProjectRequest(
                "Integration Test Project",
                "Testing the full project lifecycle",
                null, null, null,
                LocalDate.of(2025, 6, 1),
                LocalDate.of(2025, 12, 31),
                "Test Address 123",
                "Moscow",
                "Moscow Region",
                new BigDecimal("55.7558000"),
                new BigDecimal("37.6173000"),
                new BigDecimal("25000000.00"),
                new BigDecimal("30000000.00"),
                ProjectType.COMMERCIAL,
                "Office Building",
                ProjectPriority.HIGH
        );

        MvcResult createResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", notNullValue()))
                .andExpect(jsonPath("$.data.name", is("Integration Test Project")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")))
                .andReturn();

        String responseJson = createResult.getResponse().getContentAsString();
        String projectId = objectMapper.readTree(responseJson).path("data").path("id").asText();

        // 2. List projects and verify our project is there
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "Integration Test")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name", is("Integration Test Project")));

        // 3. Get project by ID
        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.city", is("Moscow")))
                .andExpect(jsonPath("$.data.budgetAmount").value(25000000.00));

        // 4. Transition to PLANNING
        ChangeStatusRequest planningRequest = new ChangeStatusRequest(ProjectStatus.PLANNING, null);
        mockMvc.perform(patch("/api/projects/{id}/status", projectId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(planningRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PLANNING")));

        // 5. Transition to IN_PROGRESS
        ChangeStatusRequest inProgressRequest = new ChangeStatusRequest(ProjectStatus.IN_PROGRESS, null);
        mockMvc.perform(patch("/api/projects/{id}/status", projectId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inProgressRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.data.actualStartDate", notNullValue()));

        // 6. Verify invalid transition (IN_PROGRESS -> DRAFT should fail)
        ChangeStatusRequest invalidRequest = new ChangeStatusRequest(ProjectStatus.DRAFT, null);
        mockMvc.perform(patch("/api/projects/{id}/status", projectId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));

        // 7. Verify audit logs were created
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                "Project", java.util.UUID.fromString(projectId));

        assertThat(auditLogs).isNotEmpty();
        assertThat(auditLogs).anyMatch(log -> log.getAction().name().equals("CREATE"));
        assertThat(auditLogs).anyMatch(log ->
                log.getAction().name().equals("STATUS_CHANGE") &&
                "DRAFT".equals(log.getOldValue()) &&
                "PLANNING".equals(log.getNewValue()));

        // 8. Dashboard summary should include our project
        mockMvc.perform(get("/api/projects/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalProjects").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    @DisplayName("Should reject unauthenticated requests")
    void unauthenticatedRequest_Rejected() throws Exception {
        mockMvc.perform(get("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
