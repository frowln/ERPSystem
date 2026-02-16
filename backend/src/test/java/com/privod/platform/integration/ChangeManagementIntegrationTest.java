package com.privod.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
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
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Change Management module.
 * Tests the full lifecycle: Change Event -> Change Order Request -> Change Order.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChangeManagementIntegrationTest {

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
    // Helper methods
    // =========================================================================

    private UUID createTestProject() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "Change Mgmt Integration Test",
                "Testing change management lifecycle",
                null, null, null,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                "Test Address",
                "Moscow",
                "Moscow Region",
                new BigDecimal("55.7558000"),
                new BigDecimal("37.6173000"),
                new BigDecimal("50000000.00"),
                new BigDecimal("60000000.00"),
                ProjectType.INDUSTRIAL,
                "Factory Building",
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

    private UUID createContract(UUID projectId) throws Exception {
        String payload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("name", "General Construction Contract");
            put("contractDate", "2025-01-15");
            put("partnerName", "TestBuilder LLC");
            put("projectId", projectId.toString());
            put("amount", "45000000.00");
            put("vatRate", "20.00");
            put("paymentTerms", "Net 30");
            put("plannedStartDate", "2025-02-01");
            put("plannedEndDate", "2025-11-30");
            put("responsibleId", adminUserId.toString());
            put("retentionPercent", "5.00");
        }});

        MvcResult result = mockMvc.perform(post("/api/contracts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        return UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText());
    }

    // =========================================================================
    // Full lifecycle: Change Event -> COR -> Change Order
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("Full change management lifecycle: event -> COR -> change order")
    void fullChangeManagementLifecycle() throws Exception {
        UUID projectId = createTestProject();
        UUID contractId = createContract(projectId);

        // =====================================================================
        // Step 1: Create a Change Event
        // =====================================================================
        String eventPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Foundation design revision due to unexpected soil conditions");
            put("description", "Geotechnical investigation revealed rock layer at -3m instead of expected -5m");
            put("source", "FIELD_CONDITION");
            put("identifiedById", adminUserId.toString());
            put("identifiedDate", "2025-03-01");
            put("estimatedCostImpact", "2500000.00");
            put("estimatedScheduleImpact", 14);
            put("contractId", contractId.toString());
        }});

        MvcResult eventResult = mockMvc.perform(post("/api/change-events")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Foundation design revision due to unexpected soil conditions")))
                .andExpect(jsonPath("$.data.status", is("IDENTIFIED")))
                .andReturn();

        String eventId = objectMapper.readTree(eventResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 2: Transition IDENTIFIED -> UNDER_REVIEW
        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "UNDER_REVIEW");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("UNDER_REVIEW")));

        // Step 3: Transition UNDER_REVIEW -> APPROVED_FOR_PRICING
        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED_FOR_PRICING");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED_FOR_PRICING")));

        // =====================================================================
        // Step 4: Create a Change Order Request linked to the event
        // =====================================================================
        String corPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("changeEventId", eventId);
            put("projectId", projectId.toString());
            put("title", "COR: Rock excavation and revised foundation design");
            put("description", "Request for additional rock excavation and modified pile design");
            put("requestedById", adminUserId.toString());
            put("requestedDate", "2025-03-05");
            put("proposedCost", "2750000.00");
            put("proposedScheduleChange", 10);
            put("justification", "Unforeseen subsurface conditions require design modification per section 4.4 of contract");
        }});

        MvcResult corResult = mockMvc.perform(post("/api/change-order-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("COR: Rock excavation and revised foundation design")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andReturn();

        String corId = objectMapper.readTree(corResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 5: COR status transitions: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED
        mockMvc.perform(patch("/api/change-order-requests/{id}/status", corId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "SUBMITTED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUBMITTED")));

        mockMvc.perform(patch("/api/change-order-requests/{id}/status", corId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "UNDER_REVIEW");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("UNDER_REVIEW")));

        mockMvc.perform(patch("/api/change-order-requests/{id}/status", corId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                            put("reviewedById", adminUserId.toString());
                            put("reviewComments", "Approved based on geotechnical evidence");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));

        // =====================================================================
        // Step 6: Create a Change Order
        // =====================================================================
        String coPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractId", contractId.toString());
            put("title", "CO-001: Rock excavation and revised pile foundation");
            put("description", "Change order for additional rock excavation and modified bored pile design");
            put("changeOrderType", "ADDITION");
            put("originalContractAmount", "45000000.00");
            put("scheduleImpactDays", 10);
            put("changeOrderRequestId", corId);
        }});

        MvcResult coResult = mockMvc.perform(post("/api/change-orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(coPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("CO-001: Rock excavation and revised pile foundation")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andReturn();

        String coId = objectMapper.readTree(coResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 7: CO status transitions: DRAFT -> PENDING_APPROVAL -> APPROVED -> EXECUTED
        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "PENDING_APPROVAL");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PENDING_APPROVAL")));

        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                            put("approvedById", adminUserId.toString());
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));

        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "EXECUTED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("EXECUTED")));

        // =====================================================================
        // Step 8: Also mark the change event as PRICED -> APPROVED
        // =====================================================================
        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "PRICED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PRICED")));

        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                        }})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));

        // =====================================================================
        // Step 9: Verify listing endpoints
        // =====================================================================
        mockMvc.perform(get("/api/change-events")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        mockMvc.perform(get("/api/change-order-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        mockMvc.perform(get("/api/change-orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        mockMvc.perform(get("/api/change-order-requests/by-event/{changeEventId}", eventId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));

        mockMvc.perform(get("/api/change-orders/by-contract/{contractId}", contractId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(0)));
    }

    // =========================================================================
    // Invalid status transitions
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("Change Event: invalid status transition should fail")
    void changeEventInvalidTransition() throws Exception {
        UUID projectId = createTestProject();

        String eventPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("title", "Test invalid transition");
            put("description", "Should not go directly to APPROVED from IDENTIFIED");
            put("source", "OTHER");
            put("identifiedById", adminUserId.toString());
            put("identifiedDate", "2025-04-01");
        }});

        MvcResult eventResult = mockMvc.perform(post("/api/change-events")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String eventId = objectMapper.readTree(eventResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // IDENTIFIED -> APPROVED should fail (must go through UNDER_REVIEW -> APPROVED_FOR_PRICING -> PRICED first)
        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                        }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @Order(3)
    @DisplayName("Change Order: APPROVED cannot transition back to DRAFT")
    void changeOrderCannotRevert() throws Exception {
        UUID projectId = createTestProject();
        UUID contractId = createContract(projectId);

        String coPayload = objectMapper.writeValueAsString(new LinkedHashMap<>() {{
            put("projectId", projectId.toString());
            put("contractId", contractId.toString());
            put("title", "Test CO revert");
            put("changeOrderType", "ADDITION");
            put("originalContractAmount", "45000000.00");
        }});

        MvcResult coResult = mockMvc.perform(post("/api/change-orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(coPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String coId = objectMapper.readTree(coResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Advance: DRAFT -> PENDING_APPROVAL -> APPROVED
        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "PENDING_APPROVAL");
                        }})))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "APPROVED");
                            put("approvedById", adminUserId.toString());
                        }})))
                .andExpect(status().isOk());

        // APPROVED -> DRAFT should fail
        mockMvc.perform(patch("/api/change-orders/{id}/status", coId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LinkedHashMap<>() {{
                            put("status", "DRAFT");
                        }})))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
