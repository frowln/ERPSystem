package com.privod.platform.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
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
import java.util.LinkedHashMap;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Cost Management module.
 * Tests cost code hierarchy, commitment lifecycle, and budget line tracking.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CostManagementIntegrationTest {

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
    // Helpers
    // =========================================================================

    private UUID createTestProject() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "Cost Management Integration Test",
                "Testing cost management lifecycle",
                null, null, null,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2026, 6, 30),
                "Industrial Zone",
                "Kazan",
                "Tatarstan",
                new BigDecimal("55.7963000"),
                new BigDecimal("49.1089000"),
                new BigDecimal("100000000.00"),
                new BigDecimal("120000000.00"),
                ProjectType.INDUSTRIAL,
                "Manufacturing Plant",
                ProjectPriority.CRITICAL
        );

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText());
    }

    private String createCostCode(UUID projectId, String code, String name, String level,
                                  UUID parentId, BigDecimal budgetAmount) throws Exception {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("code", code);
            put("name", name);
            put("level", level);
            put("budgetAmount", budgetAmount);
        }};
        if (parentId != null) {
            payload.put("parentId", parentId.toString());
        }

        MvcResult result = mockMvc.perform(post("/api/cost-codes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();
    }

    // =========================================================================
    // Cost Code Hierarchy
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("Create cost code hierarchy: L1 -> L2 -> L3")
    void createCostCodeHierarchy() throws Exception {
        UUID projectId = createTestProject();

        // Level 1 root cost codes
        String l1StructuralId = createCostCode(projectId, "03", "Concrete",
                "LEVEL1", null, new BigDecimal("30000000.00"));
        String l1SteelId = createCostCode(projectId, "05", "Metals",
                "LEVEL1", null, new BigDecimal("25000000.00"));
        String l1MepId = createCostCode(projectId, "22", "Plumbing",
                "LEVEL1", null, new BigDecimal("15000000.00"));

        // Level 2 under Concrete
        String l2FoundationId = createCostCode(projectId, "03.01", "Foundation Concrete",
                "LEVEL2", UUID.fromString(l1StructuralId), new BigDecimal("12000000.00"));
        String l2StructureId = createCostCode(projectId, "03.02", "Structural Concrete",
                "LEVEL2", UUID.fromString(l1StructuralId), new BigDecimal("18000000.00"));

        // Level 3 under Foundation Concrete
        String l3PilesId = createCostCode(projectId, "03.01.01", "Pile Foundations",
                "LEVEL3", UUID.fromString(l2FoundationId), new BigDecimal("5000000.00"));
        String l3SlabId = createCostCode(projectId, "03.01.02", "Ground Floor Slab",
                "LEVEL3", UUID.fromString(l2FoundationId), new BigDecimal("7000000.00"));

        // Verify hierarchy: get children of L1 Concrete
        mockMvc.perform(get("/api/cost-codes/{id}/children", l1StructuralId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(2)));

        // Verify hierarchy: get children of L2 Foundation
        mockMvc.perform(get("/api/cost-codes/{id}/children", l2FoundationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(2)));

        // List all cost codes for project
        mockMvc.perform(get("/api/cost-codes/all")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(7)));

        // Paginated listing
        mockMvc.perform(get("/api/cost-codes")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(7)));

        // Get specific cost code
        mockMvc.perform(get("/api/cost-codes/{id}", l3PilesId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code", is("03.01.01")))
                .andExpect(jsonPath("$.data.name", is("Pile Foundations")));
    }

    // =========================================================================
    // Commitment Lifecycle: DRAFT -> ISSUED -> APPROVED -> CLOSED
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("Commitment lifecycle: create -> issue -> approve -> close")
    void commitmentLifecycle() throws Exception {
        UUID projectId = createTestProject();

        // Create a cost code for the commitment
        String costCodeId = createCostCode(projectId, "05.01", "Structural Steel Supply",
                "LEVEL2", null, new BigDecimal("20000000.00"));

        // 1. Create commitment
        String commitmentPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Steel supply contract - Building A");
            put("commitmentType", "PURCHASE_ORDER");
            put("originalAmount", "18500000.00");
            put("retentionPercent", "5.00");
            put("startDate", "2025-03-01");
            put("endDate", "2025-08-31");
            put("costCodeId", costCodeId);
        }});

        MvcResult createResult = mockMvc.perform(post("/api/commitments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(commitmentPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Steel supply contract - Building A")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.originalAmount").value(18500000.00))
                .andReturn();

        String commitmentId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Add commitment items
        String item1Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("description", "W14x30 beams - 450 tons");
            put("quantity", 450);
            put("unit", "ton");
            put("unitPrice", "25000.00");
            put("costCodeId", costCodeId);
        }});

        mockMvc.perform(post("/api/commitments/{id}/items", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(item1Payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        String item2Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("description", "HSS 200x200x10 columns - 120 tons");
            put("quantity", 120);
            put("unit", "ton");
            put("unitPrice", "35000.00");
            put("costCodeId", costCodeId);
        }});

        mockMvc.perform(post("/api/commitments/{id}/items", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(item2Payload))
                .andExpect(status().isCreated());

        // 3. List items
        mockMvc.perform(get("/api/commitments/{id}/items", commitmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(2)));

        // 4. Transition DRAFT -> ISSUED
        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "ISSUED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ISSUED")));

        // 5. Transition ISSUED -> APPROVED
        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));

        // 6. Add a change order to the commitment
        mockMvc.perform(post("/api/commitments/{id}/change-orders", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .param("amount", "750000.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 7. Transition APPROVED -> CLOSED
        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "CLOSED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));

        // 8. Verify final state
        mockMvc.perform(get("/api/commitments/{id}", commitmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));

        // 9. List commitments by project
        mockMvc.perform(get("/api/commitments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));
    }

    // =========================================================================
    // Budget vs Actual Tracking
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("Budget line creation and summary endpoints")
    void budgetVsActualTracking() throws Exception {
        UUID projectId = createTestProject();

        // Create cost codes for budget lines
        String ccFoundation = createCostCode(projectId, "B-03", "Foundation Work",
                "LEVEL1", null, new BigDecimal("15000000.00"));
        String ccStructure = createCostCode(projectId, "B-05", "Steel Structure",
                "LEVEL1", null, new BigDecimal("20000000.00"));

        // Create budget lines
        String budgetLine1Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("costCodeId", ccFoundation);
            put("description", "Foundation concrete and reinforcement");
            put("originalBudget", "15000000.00");
            put("approvedChanges", "500000.00");
            put("forecastFinalCost", "15800000.00");
        }});

        mockMvc.perform(post("/api/budget-lines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(budgetLine1Payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        String budgetLine2Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("costCodeId", ccStructure);
            put("description", "Structural steel fabrication and erection");
            put("originalBudget", "20000000.00");
            put("approvedChanges", "1200000.00");
            put("forecastFinalCost", "21500000.00");
        }});

        mockMvc.perform(post("/api/budget-lines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(budgetLine2Payload))
                .andExpect(status().isCreated());

        // List budget lines
        mockMvc.perform(get("/api/budget-lines")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));

        // List all budget lines (no pagination)
        mockMvc.perform(get("/api/budget-lines/all")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(2)));

        // Summary: total original budget
        mockMvc.perform(get("/api/budget-lines/summary/original-budget")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()));

        // Summary: total revised budget
        mockMvc.perform(get("/api/budget-lines/summary/revised-budget")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Summary: total actual cost
        mockMvc.perform(get("/api/budget-lines/summary/actual-cost")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Summary: total variance
        mockMvc.perform(get("/api/budget-lines/summary/variance")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // =========================================================================
    // Invalid commitment transitions
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("Commitment: invalid status transition should fail")
    void commitmentInvalidTransition() throws Exception {
        UUID projectId = createTestProject();

        String commitmentPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Invalid transition test");
            put("commitmentType", "SUBCONTRACT");
            put("originalAmount", "5000000.00");
        }});

        MvcResult result = mockMvc.perform(post("/api/commitments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(commitmentPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String commitmentId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // DRAFT -> APPROVED should fail (must go DRAFT -> ISSUED -> APPROVED)
        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                        }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));

        // DRAFT -> CLOSED should fail
        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "CLOSED");
                        }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
