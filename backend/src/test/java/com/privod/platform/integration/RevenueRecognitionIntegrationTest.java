package com.privod.platform.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.organization.repository.OrganizationRepository;
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
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Revenue Recognition module.
 * Tests revenue contract creation, period calculation with percentage-of-completion,
 * and adjustment workflow.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RevenueRecognitionIntegrationTest {

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
    private OrganizationRepository organizationRepository;

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
                "Revenue Recognition Test Project",
                "Testing revenue recognition lifecycle",
                null, null, null,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2026, 12, 31),
                "Business District",
                "St. Petersburg",
                "Leningrad Region",
                new BigDecimal("59.9343000"),
                new BigDecimal("30.3351000"),
                new BigDecimal("200000000.00"),
                new BigDecimal("250000000.00"),
                ProjectType.COMMERCIAL,
                "Business Center",
                ProjectPriority.HIGH
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

    private UUID getOrCreateOrganization() throws Exception {
        // Try to create an organization; if one exists from seed data, use it
        String orgPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("name", "Test Construction LLC");
            put("type", "GC");
            put("inn", "7701234567");
            put("kpp", "770101001");
            put("ogrn", "1177700000001");
            put("legalAddress", "Moscow, ul. Testovaya 1");
            put("phone", "+7 495 123-45-67");
            put("email", "test@construction.ru");
        }});

        MvcResult result = mockMvc.perform(post("/api/organizations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orgPayload))
                .andExpect(status().isCreated())
                .andReturn();

        return UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText());
    }

    // =========================================================================
    // Revenue Contract Creation
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("Revenue contract creation with PBU 2/2008 standard")
    void createRevenueContract() throws Exception {
        UUID projectId = createTestProject();
        UUID organizationId = getOrCreateOrganization();

        String contractPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractName", "Revenue contract - Business Center construction");
            put("recognitionMethod", "PERCENTAGE_OF_COMPLETION");
            put("recognitionStandard", "PBU_2_2008");
            put("totalContractRevenue", "200000000.00");
            put("totalEstimatedCost", "160000000.00");
            put("organizationId", organizationId.toString());
            put("startDate", "2025-01-01");
            put("endDate", "2026-12-31");
        }});

        MvcResult result = mockMvc.perform(post("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.contractName", is("Revenue contract - Business Center construction")))
                .andExpect(jsonPath("$.data.recognitionMethod", is("PERCENTAGE_OF_COMPLETION")))
                .andExpect(jsonPath("$.data.recognitionStandard", is("PBU_2_2008")))
                .andExpect(jsonPath("$.data.totalContractRevenue").value(200000000.00))
                .andReturn();

        String revenueContractId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Verify it appears in listing
        mockMvc.perform(get("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // Get by ID
        mockMvc.perform(get("/api/revenue-contracts/{id}", revenueContractId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contractName", is("Revenue contract - Business Center construction")));
    }

    // =========================================================================
    // Period Calculation with Percentage-of-Completion
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("Revenue recognition period calculation with POC method")
    void periodCalculationWithPOC() throws Exception {
        UUID projectId = createTestProject();
        UUID organizationId = getOrCreateOrganization();

        // Create revenue contract
        String contractPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractName", "POC Test Contract");
            put("recognitionMethod", "PERCENTAGE_OF_COMPLETION");
            put("recognitionStandard", "PBU_2_2008");
            put("totalContractRevenue", "100000000.00");
            put("totalEstimatedCost", "80000000.00");
            put("organizationId", organizationId.toString());
            put("startDate", "2025-01-01");
            put("endDate", "2025-12-31");
        }});

        MvcResult contractResult = mockMvc.perform(post("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String revenueContractId = objectMapper.readTree(contractResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Create Q1 recognition period
        String q1Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("revenueContractId", revenueContractId);
            put("periodStart", "2025-01-01");
            put("periodEnd", "2025-03-31");
            put("cumulativeCostIncurred", "16000000.00");
            put("notes", "Q1 2025 - foundation work completed");
        }});

        MvcResult q1Result = mockMvc.perform(post("/api/revenue-recognition-periods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(q1Payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andReturn();

        String q1PeriodId = objectMapper.readTree(q1Result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Calculate the period (percentage-of-completion)
        String calculatePayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("cumulativeCostIncurred", "16000000.00");
            put("calculatedById", adminUserId.toString());
        }});

        mockMvc.perform(post("/api/revenue-recognition-periods/{id}/calculate", q1PeriodId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(calculatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CALCULATED")));

        // Create Q2 recognition period
        String q2Payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("revenueContractId", revenueContractId);
            put("periodStart", "2025-04-01");
            put("periodEnd", "2025-06-30");
            put("cumulativeCostIncurred", "36000000.00");
            put("notes", "Q2 2025 - structural work in progress");
        }});

        MvcResult q2Result = mockMvc.perform(post("/api/revenue-recognition-periods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(q2Payload))
                .andExpect(status().isCreated())
                .andReturn();

        String q2PeriodId = objectMapper.readTree(q2Result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // List periods
        mockMvc.perform(get("/api/revenue-recognition-periods")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("revenueContractId", revenueContractId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));

        // Get period by ID
        mockMvc.perform(get("/api/revenue-recognition-periods/{id}", q1PeriodId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CALCULATED")));

        // Status transitions: CALCULATED -> REVIEWED -> POSTED -> CLOSED
        mockMvc.perform(patch("/api/revenue-recognition-periods/{id}/status", q1PeriodId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "REVIEWED");
                            put("userId", adminUserId.toString());
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REVIEWED")));

        mockMvc.perform(patch("/api/revenue-recognition-periods/{id}/status", q1PeriodId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "POSTED");
                            put("userId", adminUserId.toString());
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("POSTED")));

        mockMvc.perform(patch("/api/revenue-recognition-periods/{id}/status", q1PeriodId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "CLOSED");
                            put("userId", adminUserId.toString());
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));
    }

    // =========================================================================
    // Adjustment Workflow
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("Revenue adjustment workflow: create, approve")
    void adjustmentWorkflow() throws Exception {
        UUID projectId = createTestProject();
        UUID organizationId = getOrCreateOrganization();

        // Create revenue contract
        String contractPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractName", "Adjustment Test Contract");
            put("recognitionMethod", "INPUT_METHOD");
            put("recognitionStandard", "FSBU_9_2025");
            put("totalContractRevenue", "50000000.00");
            put("totalEstimatedCost", "40000000.00");
            put("organizationId", organizationId.toString());
            put("startDate", "2025-01-01");
            put("endDate", "2025-12-31");
        }});

        MvcResult contractResult = mockMvc.perform(post("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String revenueContractId = objectMapper.readTree(contractResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Create a recognition period
        String periodPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("revenueContractId", revenueContractId);
            put("periodStart", "2025-01-01");
            put("periodEnd", "2025-03-31");
            put("cumulativeCostIncurred", "8000000.00");
            put("notes", "Q1 period for adjustment testing");
        }});

        MvcResult periodResult = mockMvc.perform(post("/api/revenue-recognition-periods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(periodPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String periodId = objectMapper.readTree(periodResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Create an adjustment
        String adjustmentPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("recognitionPeriodId", periodId);
            put("adjustmentType", "COST_REVISION");
            put("amount", "500000.00");
            put("reason", "Updated estimated total cost based on revised subcontractor quotes");
            put("previousValue", "40000000.00");
            put("newValue", "40500000.00");
        }});

        MvcResult adjustmentResult = mockMvc.perform(post("/api/revenue-adjustments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustmentPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.adjustmentType", is("COST_REVISION")))
                .andExpect(jsonPath("$.data.amount").value(500000.00))
                .andReturn();

        String adjustmentId = objectMapper.readTree(adjustmentResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // List adjustments by period
        mockMvc.perform(get("/api/revenue-adjustments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("periodId", periodId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        // Get adjustment by ID
        mockMvc.perform(get("/api/revenue-adjustments/{id}", adjustmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reason",
                        is("Updated estimated total cost based on revised subcontractor quotes")));

        // Approve the adjustment
        mockMvc.perform(post("/api/revenue-adjustments/{id}/approve", adjustmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .param("approvedById", adminUserId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // =========================================================================
    // Revenue contract filtering
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("Revenue contracts can be filtered by method and standard")
    void filterRevenueContracts() throws Exception {
        // The contracts created in previous tests should be filterable
        mockMvc.perform(get("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("method", "PERCENTAGE_OF_COMPLETION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("standard", "PBU_2_2008"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("standard", "FSBU_9_2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // =========================================================================
    // Invalid period status transition
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("Revenue period: invalid status transition should fail")
    void invalidPeriodTransition() throws Exception {
        UUID projectId = createTestProject();
        UUID organizationId = getOrCreateOrganization();

        String contractPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractName", "Invalid transition test");
            put("recognitionMethod", "PERCENTAGE_OF_COMPLETION");
            put("recognitionStandard", "PBU_2_2008");
            put("totalContractRevenue", "10000000.00");
            put("totalEstimatedCost", "8000000.00");
            put("organizationId", organizationId.toString());
            put("startDate", "2025-01-01");
            put("endDate", "2025-12-31");
        }});

        MvcResult contractResult = mockMvc.perform(post("/api/revenue-contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String revenueContractId = objectMapper.readTree(contractResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        String periodPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("revenueContractId", revenueContractId);
            put("periodStart", "2025-01-01");
            put("periodEnd", "2025-03-31");
        }});

        MvcResult periodResult = mockMvc.perform(post("/api/revenue-recognition-periods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(periodPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String periodId = objectMapper.readTree(periodResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // OPEN -> POSTED should fail (must go OPEN -> CALCULATED -> REVIEWED -> POSTED)
        mockMvc.perform(patch("/api/revenue-recognition-periods/{id}/status", periodId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "POSTED");
                        }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
