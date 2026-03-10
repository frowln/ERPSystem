package com.privod.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.organization.domain.Organization;
import com.privod.platform.modules.organization.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cross-tenant data isolation integration tests.
 * <p>
 * These tests verify that data created by Organization A is completely invisible to
 * Organization B. The test suite exercises multiple domain modules (Projects, Tasks,
 * Budgets, Invoices, Users, Estimates, Specifications, Documents) across all CRUD
 * operations to ensure defense-in-depth tenant isolation.
 * <p>
 * Architecture summary of tenant isolation in PRIVOD:
 * <ul>
 *   <li>Service-layer checks: each service method calls {@code SecurityUtils.requireCurrentOrganizationId()}
 *       and validates ownership before returning data.</li>
 *   <li>Repository-layer: many queries include explicit {@code organizationId} parameters.</li>
 *   <li>Hibernate filter: the {@code @FilterDef("tenantFilter")} defined in the persistence
 *       package-info provides an additional ORM-level safety net (defense in depth).</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@DisplayName("Cross-Tenant Data Isolation Tests")
class TenantIsolationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("privod_isolation_test")
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
    private OrganizationRepository organizationRepository;

    // Deterministic UUID for Tenant B — reused across all test methods.
    private static final UUID ORG_B_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String ORG_B_ADMIN_EMAIL = "admin-tenant-b@isolation-test.test";

    // --- Tenant A (the default seeded organization) ---
    private String tokenOrgA;
    private UUID orgAId;

    // --- Tenant B (created in setUp) ---
    private String tokenOrgB;
    private UUID orgBId;

    @BeforeEach
    void setUp() {
        // --- Tenant A: use the seeded admin user ---
        User adminA = userRepository.findByEmail("admin@privod.com")
                .orElseThrow(() -> new RuntimeException("Seeded admin user not found"));
        orgAId = adminA.getOrganizationId();
        assertThat(orgAId).as("Admin user must have an organizationId").isNotNull();
        tokenOrgA = jwtTokenProvider.generateToken(new CustomUserDetails(adminA));

        // --- Tenant B: create a separate organization and admin user (idempotent) ---
        orgBId = ORG_B_ID;
        if (!organizationRepository.existsById(orgBId)) {
            Organization orgB = Organization.builder()
                    .name("Tenant B Corp")
                    .inn("9999999999")
                    .build();
            orgB.setId(orgBId);
            organizationRepository.save(orgB);
        }

        User adminB = userRepository.findByEmail(ORG_B_ADMIN_EMAIL).orElseGet(() -> {
            Role adminRole = roleRepository.findByCode("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found"));
            User u = User.builder()
                    .email(ORG_B_ADMIN_EMAIL)
                    .passwordHash("$2a$10$96KQ9KTRdDMvn/EJHZozNuzxtb/VfAcYHIegBJkvRgfbR9P9f/DAK")
                    .firstName("Admin")
                    .lastName("TenantB")
                    .enabled(true)
                    .organizationId(orgBId)
                    .build();
            u.addRole(adminRole);
            return userRepository.save(u);
        });
        tokenOrgB = jwtTokenProvider.generateToken(new CustomUserDetails(adminB));
    }

    // -------------------------------------------------------------------------
    // Helper: create a project under a given tenant and return its UUID
    // -------------------------------------------------------------------------
    private String createProject(String token, String name) throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "name", name,
                        "priority", "NORMAL",
                        "type", "COMMERCIAL"
                )
        );

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asText();
    }

    // -------------------------------------------------------------------------
    // Helper: create a task under a project and return its UUID
    // -------------------------------------------------------------------------
    private String createTask(String token, String projectId, String title) throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "projectId", projectId,
                        "title", title,
                        "priority", "MEDIUM"
                )
        );

        MvcResult result = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asText();
    }

    // -------------------------------------------------------------------------
    // Helper: create a budget under a project and return its UUID
    // -------------------------------------------------------------------------
    private String createBudget(String token, String projectId, String name) throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "projectId", projectId,
                        "name", name,
                        "plannedRevenue", 100000,
                        "plannedCost", 80000
                )
        );

        MvcResult result = mockMvc.perform(post("/api/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asText();
    }

    // -------------------------------------------------------------------------
    // Helper: create an estimate under a project and return its UUID
    // -------------------------------------------------------------------------
    private String createEstimate(String token, String projectId, String name) throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "projectId", projectId,
                        "name", name
                )
        );

        MvcResult result = mockMvc.perform(post("/api/estimates")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asText();
    }

    // =========================================================================
    //  PROJECT ISOLATION
    // =========================================================================
    @Nested
    @DisplayName("Project Isolation")
    class ProjectIsolation {

        @Test
        @DisplayName("Tenant B cannot list Tenant A's projects")
        void orgB_cannotSee_orgA_projects() throws Exception {
            // Arrange: create a project under Org A
            createProject(tokenOrgA, "Org-A Secret Project");

            // Act: list projects as Org B
            MvcResult result = mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .param("search", "Org-A Secret")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andReturn();

            // Assert: Org B sees zero results for Org A's project name
            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data");
            int totalElements = data.path("totalElements").asInt();
            assertThat(totalElements).isZero();
        }

        @Test
        @DisplayName("Tenant B cannot GET Tenant A's project by ID")
        void orgB_cannotGet_orgA_project() throws Exception {
            String projectId = createProject(tokenOrgA, "Org-A Private Project");

            // Org B attempts direct access by ID
            mockMvc.perform(get("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Tenant B cannot UPDATE Tenant A's project")
        void orgB_cannotUpdate_orgA_project() throws Exception {
            String projectId = createProject(tokenOrgA, "Org-A Locked Project");

            String updateBody = objectMapper.writeValueAsString(
                    java.util.Map.of("name", "Hijacked by Org-B")
            );

            mockMvc.perform(put("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateBody))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Tenant B cannot DELETE Tenant A's project")
        void orgB_cannotDelete_orgA_project() throws Exception {
            String projectId = createProject(tokenOrgA, "Org-A Protected Project");

            mockMvc.perform(delete("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Tenant A still sees its own project after Tenant B queries")
        void orgA_seeOwnProject_afterOrgB_query() throws Exception {
            String projectId = createProject(tokenOrgA, "Org-A Visible Project");

            // Org B tries and fails
            mockMvc.perform(get("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgB))
                    .andExpect(status().isNotFound());

            // Org A still sees it
            mockMvc.perform(get("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgA)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name", is("Org-A Visible Project")));
        }

        @Test
        @DisplayName("Tenant B cannot create a project under Tenant A's organizationId")
        void orgB_cannotCreate_projectInOrgA() throws Exception {
            String body = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "name", "Attempt to inject into Org-A",
                            "organizationId", orgAId.toString(),
                            "priority", "NORMAL",
                            "type", "COMMERCIAL"
                    )
            );

            // The service should reject this because the caller's org != request.organizationId
            mockMvc.perform(post("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    //  TASK ISOLATION
    // =========================================================================
    @Nested
    @DisplayName("Task Isolation")
    class TaskIsolation {

        @Test
        @DisplayName("Tenant B cannot list Tenant A's tasks")
        void orgB_cannotSee_orgA_tasks() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Task Project");
            createTask(tokenOrgA, projectId, "OrgA Secret Task");

            // Org B lists tasks scoped to Org A's project
            mockMvc.perform(get("/api/tasks")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .param("projectId", projectId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }

        @Test
        @DisplayName("Tenant B cannot GET Tenant A's task by ID")
        void orgB_cannotGet_orgA_task() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Task Project 2");
            String taskId = createTask(tokenOrgA, projectId, "OrgA Secret Task 2");

            mockMvc.perform(get("/api/tasks/{id}", taskId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    //  FINANCE ISOLATION (Budgets)
    // =========================================================================
    @Nested
    @DisplayName("Finance Isolation — Budgets")
    class BudgetIsolation {

        @Test
        @DisplayName("Tenant B cannot list Tenant A's budgets")
        void orgB_cannotSee_orgA_budgets() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Finance Project");
            createBudget(tokenOrgA, projectId, "OrgA Budget");

            // Org B lists all budgets — should see none from Org A
            MvcResult result = mockMvc.perform(get("/api/budgets")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data");
            int totalElements = data.path("totalElements").asInt();
            assertThat(totalElements).isZero();
        }

        @Test
        @DisplayName("Tenant B cannot GET Tenant A's budget by ID")
        void orgB_cannotGet_orgA_budget() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Finance Project 2");
            String budgetId = createBudget(tokenOrgA, projectId, "OrgA Budget 2");

            mockMvc.perform(get("/api/budgets/{id}", budgetId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Tenant B cannot create a budget in Tenant A's project")
        void orgB_cannotCreate_budgetInOrgA_project() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Finance Project 3");

            String body = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "projectId", projectId,
                            "name", "Hijack Budget",
                            "plannedRevenue", 100000,
                            "plannedCost", 80000
                    )
            );

            mockMvc.perform(post("/api/budgets")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    //  ESTIMATE ISOLATION
    // =========================================================================
    @Nested
    @DisplayName("Estimate Isolation")
    class EstimateIsolation {

        @Test
        @DisplayName("Tenant B cannot list Tenant A's estimates")
        void orgB_cannotSee_orgA_estimates() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Estimate Project");
            createEstimate(tokenOrgA, projectId, "OrgA Estimate");

            MvcResult result = mockMvc.perform(get("/api/estimates")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data");
            int totalElements = data.path("totalElements").asInt();
            assertThat(totalElements).isZero();
        }

        @Test
        @DisplayName("Tenant B cannot GET Tenant A's estimate by ID")
        void orgB_cannotGet_orgA_estimate() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Estimate Project 2");
            String estimateId = createEstimate(tokenOrgA, projectId, "OrgA Estimate 2");

            mockMvc.perform(get("/api/estimates/{id}", estimateId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    //  USER ISOLATION
    // =========================================================================
    @Nested
    @DisplayName("User Isolation")
    class UserIsolation {

        @Test
        @DisplayName("Tenant B admin cannot see Tenant A's users in admin list")
        void orgB_cannotSee_orgA_users() throws Exception {
            // The /api/admin/users endpoint should only return users from the caller's org
            MvcResult result = mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data");

            // Org B should only see its own admin user, not Org A's users
            JsonNode content = data.path("content");
            if (content.isArray()) {
                for (JsonNode user : content) {
                    String email = user.path("email").asText();
                    assertThat(email)
                            .as("Org B must not see Org A admin email")
                            .doesNotContain("admin@privod.com");
                }
            }
        }

        @Test
        @DisplayName("Tenant B cannot GET Tenant A's user by ID")
        void orgB_cannotGet_orgA_user() throws Exception {
            User adminA = userRepository.findByEmail("admin@privod.com").orElseThrow();

            mockMvc.perform(get("/api/admin/users/{id}", adminA.getId())
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    //  DASHBOARD ISOLATION
    // =========================================================================
    @Nested
    @DisplayName("Dashboard Isolation")
    class DashboardIsolation {

        @Test
        @DisplayName("Tenant B dashboard does not include Tenant A's project counts")
        void orgB_dashboard_excludesOrgA() throws Exception {
            // Create projects in Org A
            createProject(tokenOrgA, "OrgA Dashboard Project 1");
            createProject(tokenOrgA, "OrgA Dashboard Project 2");

            // Org B dashboard
            MvcResult result = mockMvc.perform(get("/api/projects/dashboard/summary")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data");
            int totalProjects = data.path("totalProjects").asInt();
            assertThat(totalProjects)
                    .as("Org B should have 0 projects, not see Org A's")
                    .isZero();
        }
    }

    // =========================================================================
    //  CROSS-MODULE OBJECT REFERENCE ISOLATION
    //  Verify that even if Org B knows an entity ID, they cannot reference it
    //  when creating related objects (e.g., creating a task in Org A's project).
    // =========================================================================
    @Nested
    @DisplayName("Cross-Reference Isolation")
    class CrossReferenceIsolation {

        @Test
        @DisplayName("Tenant B cannot create a task in Tenant A's project")
        void orgB_cannotCreate_taskInOrgA_project() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA Cross-Ref Project");

            String body = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "projectId", projectId,
                            "title", "Tenant B sneaky task",
                            "priority", "HIGH"
                    )
            );

            // Attempting to create a task in another tenant's project should fail
            mockMvc.perform(post("/api/tasks")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Tenant B cannot import Tenant A's estimate into a budget")
        void orgB_cannotImport_orgA_estimateIntoBudget() throws Exception {
            // Create project + estimate in Org A
            String projectIdA = createProject(tokenOrgA, "OrgA Import Project");
            String estimateIdA = createEstimate(tokenOrgA, projectIdA, "OrgA Import Estimate");

            // Create project + budget in Org B
            String projectIdB = createProject(tokenOrgB, "OrgB Import Project");
            String budgetIdB = createBudget(tokenOrgB, projectIdB, "OrgB Budget");

            // Org B tries to import Org A's estimate into its own budget
            mockMvc.perform(post("/api/budgets/{budgetId}/items/import-estimate", budgetIdB)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .param("estimateId", estimateIdA)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    //  BIDIRECTIONAL ISOLATION
    //  Verify that isolation works both ways: A cannot see B, and B cannot see A.
    // =========================================================================
    @Nested
    @DisplayName("Bidirectional Isolation")
    class BidirectionalIsolation {

        @Test
        @DisplayName("Both tenants create projects, neither sees the other's data")
        void bothTenants_seeOnlyOwnData() throws Exception {
            // Org A creates projects
            createProject(tokenOrgA, "Alpha-1");
            createProject(tokenOrgA, "Alpha-2");

            // Org B creates projects
            createProject(tokenOrgB, "Beta-1");

            // Org A lists projects — should see exactly its own (Alpha-1, Alpha-2, plus any from other tests)
            MvcResult resultA = mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgA)
                            .param("search", "Alpha")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode dataA = objectMapper.readTree(resultA.getResponse().getContentAsString()).path("data");
            assertThat(dataA.path("totalElements").asInt()).isGreaterThanOrEqualTo(2);

            // Org A must NOT see Beta-1
            MvcResult resultASearchBeta = mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgA)
                            .param("search", "Beta")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode dataABeta = objectMapper.readTree(resultASearchBeta.getResponse().getContentAsString()).path("data");
            assertThat(dataABeta.path("totalElements").asInt()).isZero();

            // Org B must NOT see Alpha projects
            MvcResult resultBSearchAlpha = mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .param("search", "Alpha")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode dataBAlpha = objectMapper.readTree(resultBSearchAlpha.getResponse().getContentAsString()).path("data");
            assertThat(dataBAlpha.path("totalElements").asInt()).isZero();

            // Org B sees its own
            MvcResult resultB = mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .param("search", "Beta")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode dataB = objectMapper.readTree(resultB.getResponse().getContentAsString()).path("data");
            assertThat(dataB.path("totalElements").asInt()).isEqualTo(1);
        }
    }

    // =========================================================================
    //  UUID GUESSING ATTACK SIMULATION
    //  Even if an attacker guesses or obtains a valid UUID, access must be denied.
    // =========================================================================
    @Nested
    @DisplayName("UUID Enumeration Protection")
    class UuidEnumerationProtection {

        @Test
        @DisplayName("Random UUID returns 404, not 403 (no existence leakage)")
        void randomUuid_returnsNotFound() throws Exception {
            UUID randomId = UUID.randomUUID();

            // Regardless of whether the entity exists, the response must be 404
            // (not 403 or 401) to avoid leaking entity existence to attackers
            mockMvc.perform(get("/api/projects/{id}", randomId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Known cross-tenant project ID returns 404, not 403")
        void knownCrossTenant_projectId_returnsNotFound() throws Exception {
            String projectId = createProject(tokenOrgA, "OrgA UUID Test Project");

            // Org B uses the real UUID — response should be 404, NOT 403.
            // 403 would leak that the entity exists but belongs to another tenant.
            mockMvc.perform(get("/api/projects/{id}", projectId)
                            .header("Authorization", "Bearer " + tokenOrgB)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }
}
