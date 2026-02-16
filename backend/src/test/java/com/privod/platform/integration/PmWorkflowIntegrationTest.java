package com.privod.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectType;
import com.privod.platform.modules.project.web.dto.CreateProjectRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
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
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the PM Workflow module (RFI, Submittals, Issues).
 * Tests full lifecycle flows through the REST API with a real PostgreSQL database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PmWorkflowIntegrationTest {

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

    private String adminToken;
    private UUID adminUserId;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByEmail("admin@privod.ru")
                .orElseThrow(() -> new RuntimeException("Admin user not found"));
        adminUserId = admin.getId();
        CustomUserDetails userDetails = new CustomUserDetails(admin);
        adminToken = jwtTokenProvider.generateToken(userDetails);
    }

    // =========================================================================
    // Helper: create a project and return its ID
    // =========================================================================

    private UUID createTestProject(String suffix) throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "PM Workflow Test " + suffix,
                "Testing PM workflow lifecycle",
                null, null, null,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                "Test Address",
                "Moscow",
                "Moscow Region",
                new BigDecimal("55.7558000"),
                new BigDecimal("37.6173000"),
                new BigDecimal("10000000.00"),
                new BigDecimal("12000000.00"),
                ProjectType.COMMERCIAL,
                "Office Building",
                ProjectPriority.HIGH
        );

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(root.path("data").path("id").asText());
    }

    // =========================================================================
    // RFI Lifecycle: create -> open -> assign -> answer -> close
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("RFI full lifecycle: create, respond, close")
    void rfiLifecycle() throws Exception {
        UUID projectId = createTestProject("RFI");

        // 1. Create RFI
        String rfiPayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("subject", "Clarification on structural steel spec");
            put("question", "What is the minimum yield strength for W14x30 beams in section A?");
            put("priority", "HIGH");
            put("assignedToId", adminUserId.toString());
            put("responsibleId", adminUserId.toString());
            put("dueDate", "2025-03-15");
            put("costImpact", false);
            put("scheduleImpact", true);
        }});

        MvcResult createResult = mockMvc.perform(post("/api/pm/rfis")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rfiPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.subject", is("Clarification on structural steel spec")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andReturn();

        String rfiId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Transition DRAFT -> OPEN
        mockMvc.perform(patch("/api/pm/rfis/{id}/status", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "OPEN");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("OPEN")));

        // 3. Transition OPEN -> ASSIGNED
        mockMvc.perform(patch("/api/pm/rfis/{id}/status", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "ASSIGNED");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ASSIGNED")));

        // 4. Add response to the RFI
        String responsePayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("rfiId", rfiId);
            put("responderId", adminUserId.toString());
            put("responseText", "Minimum yield strength is 50 ksi per ASTM A992. See spec section 05 12 00.");
            put("isOfficial", true);
        }});

        mockMvc.perform(post("/api/pm/rfis/{rfiId}/responses", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(responsePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.responseText",
                        is("Minimum yield strength is 50 ksi per ASTM A992. See spec section 05 12 00.")));

        // 5. Transition ASSIGNED -> ANSWERED
        mockMvc.perform(patch("/api/pm/rfis/{id}/status", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "ANSWERED");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ANSWERED")));

        // 6. Transition ANSWERED -> CLOSED
        mockMvc.perform(patch("/api/pm/rfis/{id}/status", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "CLOSED");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));

        // 7. Verify RFI is listed
        mockMvc.perform(get("/api/pm/rfis")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // 8. Verify RFI responses are listed
        mockMvc.perform(get("/api/pm/rfis/{rfiId}/responses", rfiId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // 9. Get RFI by ID and confirm final state
        mockMvc.perform(get("/api/pm/rfis/{id}", rfiId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")))
                .andExpect(jsonPath("$.data.subject", is("Clarification on structural steel spec")));
    }

    // =========================================================================
    // Submittal Package Lifecycle
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("Submittal package: create package with submittals")
    void submittalPackageLifecycle() throws Exception {
        UUID projectId = createTestProject("Submittal");

        // 1. Create a submittal
        String submittalPayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Structural Steel Shop Drawings - Building A");
            put("description", "Shop drawings for steel framing per spec 05 12 00");
            put("submittalType", "SHOP_DRAWING");
            put("specSection", "05 12 00");
            put("dueDate", "2025-04-01");
            put("submittedById", adminUserId.toString());
            put("ballInCourt", adminUserId.toString());
            put("leadTime", 14);
            put("requiredDate", "2025-05-01");
        }});

        MvcResult submittalResult = mockMvc.perform(post("/api/pm/submittals")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submittalPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Structural Steel Shop Drawings - Building A")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andReturn();

        String submittalId = objectMapper.readTree(submittalResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Create a second submittal
        String submittal2Payload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Concrete Mix Design - Grade C30");
            put("description", "Concrete mix proportions for foundation elements");
            put("submittalType", "DESIGN_MIX");
            put("specSection", "03 30 00");
            put("dueDate", "2025-04-15");
            put("submittedById", adminUserId.toString());
            put("ballInCourt", adminUserId.toString());
            put("leadTime", 7);
            put("requiredDate", "2025-05-15");
        }});

        MvcResult submittal2Result = mockMvc.perform(post("/api/pm/submittals")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submittal2Payload))
                .andExpect(status().isCreated())
                .andReturn();

        String submittal2Id = objectMapper.readTree(submittal2Result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 3. Create a submittal package containing both
        String packagePayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Building A - Phase 1 Submittals");
            put("description", "All submittals required for Phase 1 structural work");
            put("submittalIds", submittalId + "," + submittal2Id);
        }});

        MvcResult packageResult = mockMvc.perform(post("/api/pm/submittals/packages")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(packagePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Building A - Phase 1 Submittals")))
                .andReturn();

        // 4. List submittal packages
        mockMvc.perform(get("/api/pm/submittals/packages")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // 5. List submittals by project
        mockMvc.perform(get("/api/pm/submittals")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));

        // 6. Get submittal by ID
        mockMvc.perform(get("/api/pm/submittals/{id}", submittalId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("Structural Steel Shop Drawings - Building A")));

        // 7. Check ball-in-court
        mockMvc.perform(get("/api/pm/submittals/ball-in-court/{userId}", adminUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // =========================================================================
    // Issue Lifecycle: create -> in_progress -> resolved -> closed
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("Issue lifecycle: create, assign, resolve, close")
    void issueLifecycle() throws Exception {
        UUID projectId = createTestProject("Issue");

        // 1. Create issue
        String issuePayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Water infiltration at basement wall joint B3-B4");
            put("description", "Visible water seepage at construction joint between wall panels B3 and B4 at level -1");
            put("issueType", "DESIGN");
            put("priority", "HIGH");
            put("assignedToId", adminUserId.toString());
            put("reportedById", adminUserId.toString());
            put("dueDate", "2025-03-01");
            put("location", "Level -1, Grid B3-B4");
        }});

        MvcResult createResult = mockMvc.perform(post("/api/pm/issues")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(issuePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Water infiltration at basement wall joint B3-B4")))
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andReturn();

        String issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Transition OPEN -> IN_PROGRESS
        mockMvc.perform(patch("/api/pm/issues/{id}/status", issueId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "IN_PROGRESS");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));

        // 3. Add a comment
        String commentPayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("issueId", issueId);
            put("authorId", adminUserId.toString());
            put("text", "Waterproofing contractor dispatched. Injection grouting planned for Friday.");
        }});

        mockMvc.perform(post("/api/pm/issues/{issueId}/comments", issueId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(commentPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        // 4. Transition IN_PROGRESS -> RESOLVED
        mockMvc.perform(patch("/api/pm/issues/{id}/status", issueId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "RESOLVED");
                                    put("resolvedById", adminUserId.toString());
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")));

        // 5. Transition RESOLVED -> CLOSED
        mockMvc.perform(patch("/api/pm/issues/{id}/status", issueId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "CLOSED");
                                }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));

        // 6. Verify issue comments are listed
        mockMvc.perform(get("/api/pm/issues/{issueId}/comments", issueId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // 7. Verify final state
        mockMvc.perform(get("/api/pm/issues/{id}", issueId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));
    }

    // =========================================================================
    // Invalid transitions should fail
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("RFI: invalid status transition should fail")
    void rfiInvalidTransition() throws Exception {
        UUID projectId = createTestProject("RFI-Invalid");

        // Create RFI (starts as DRAFT)
        String rfiPayload = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("subject", "Invalid transition test");
            put("question", "Test question");
            put("priority", "NORMAL");
            put("assignedToId", adminUserId.toString());
            put("responsibleId", adminUserId.toString());
            put("dueDate", "2025-06-01");
        }});

        MvcResult createResult = mockMvc.perform(post("/api/pm/rfis")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rfiPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String rfiId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Try DRAFT -> CLOSED (invalid; must go DRAFT -> OPEN first)
        mockMvc.perform(patch("/api/pm/rfis/{id}/status", rfiId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new java.util.LinkedHashMap<>() {{
                                    put("status", "CLOSED");
                                }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @Order(5)
    @DisplayName("Overdue RFIs endpoint should return OK")
    void overdueRfisEndpoint() throws Exception {
        mockMvc.perform(get("/api/pm/rfis/overdue")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @Order(6)
    @DisplayName("Overdue Issues endpoint should return OK")
    void overdueIssuesEndpoint() throws Exception {
        mockMvc.perform(get("/api/pm/issues/overdue")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @Order(7)
    @DisplayName("Overdue Submittals endpoint should return OK")
    void overdueSubmittalsEndpoint() throws Exception {
        mockMvc.perform(get("/api/pm/submittals/overdue")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
