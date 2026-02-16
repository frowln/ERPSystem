package com.privod.platform.integration;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API Smoke Tests -- verifies that all critical API endpoints respond correctly.
 * These tests do NOT verify business logic; they only confirm that
 * endpoints are wired up, return expected HTTP status codes, and the
 * JSON envelope structure ($.success) is correct.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class ApiSmokeTest {

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
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByEmail("admin@privod.ru")
                .orElseThrow(() -> new RuntimeException("Admin user not found"));
        CustomUserDetails userDetails = new CustomUserDetails(admin);
        adminToken = jwtTokenProvider.generateToken(userDetails);
    }

    // =========================================================================
    // Infrastructure / Actuator
    // =========================================================================

    @Nested
    @DisplayName("Infrastructure endpoints")
    class InfrastructureEndpoints {

        @Test
        @DisplayName("GET /actuator/health returns UP")
        void actuatorHealth() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("UP")));
        }
    }

    // =========================================================================
    // Projects
    // =========================================================================

    @Nested
    @DisplayName("Project endpoints")
    class ProjectEndpoints {

        @Test
        @DisplayName("GET /api/projects returns 200")
        void listProjects() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/projects/dashboard/summary returns 200")
        void projectDashboard() throws Exception {
            mockMvc.perform(get("/api/projects/dashboard/summary")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Communication / Calls
    // =========================================================================

    @Nested
    @DisplayName("Communication call endpoints")
    class CommunicationCallEndpoints {

        @Test
        @DisplayName("GET /api/communication/calls returns 200")
        void listCallSessions() throws Exception {
            mockMvc.perform(get("/api/communication/calls")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Messaging
    // =========================================================================

    @Nested
    @DisplayName("Messaging endpoints")
    class MessagingEndpoints {

        @Test
        @DisplayName("GET /api/messaging/channels returns 200")
        void listChannels() throws Exception {
            mockMvc.perform(get("/api/messaging/channels")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/messaging/favorites returns 200")
        void listFavorites() throws Exception {
            mockMvc.perform(get("/api/messaging/favorites")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Contracts
    // =========================================================================

    @Nested
    @DisplayName("Contract endpoints")
    class ContractEndpoints {

        @Test
        @DisplayName("GET /api/contracts returns 200")
        void listContracts() throws Exception {
            mockMvc.perform(get("/api/contracts")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // PM Workflow
    // =========================================================================

    @Nested
    @DisplayName("PM Workflow endpoints")
    class PmWorkflowEndpoints {

        @Test
        @DisplayName("GET /api/pm/rfis returns 200")
        void listRfis() throws Exception {
            mockMvc.perform(get("/api/pm/rfis")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/pm/submittals returns 200")
        void listSubmittals() throws Exception {
            mockMvc.perform(get("/api/pm/submittals")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/pm/issues returns 200")
        void listIssues() throws Exception {
            mockMvc.perform(get("/api/pm/issues")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/pm/rfis/overdue returns 200")
        void overdueRfis() throws Exception {
            mockMvc.perform(get("/api/pm/rfis/overdue")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/pm/submittals/overdue returns 200")
        void overdueSubmittals() throws Exception {
            mockMvc.perform(get("/api/pm/submittals/overdue")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/pm/issues/overdue returns 200")
        void overdueIssues() throws Exception {
            mockMvc.perform(get("/api/pm/issues/overdue")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Change Management
    // =========================================================================

    @Nested
    @DisplayName("Change Management endpoints")
    class ChangeManagementEndpoints {

        @Test
        @DisplayName("GET /api/change-events returns 200")
        void listChangeEvents() throws Exception {
            mockMvc.perform(get("/api/change-events")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Cost Management
    // =========================================================================

    @Nested
    @DisplayName("Cost Management endpoints")
    class CostManagementEndpoints {

        @Test
        @DisplayName("GET /api/cost-codes returns 200 (with projectId param)")
        void listCostCodes() throws Exception {
            // Cost codes require a projectId param; use a random UUID for empty result
            mockMvc.perform(get("/api/cost-codes")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "00000000-0000-0000-0000-000000000000")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/commitments returns 200 (with projectId param)")
        void listCommitments() throws Exception {
            mockMvc.perform(get("/api/commitments")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "00000000-0000-0000-0000-000000000000")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/budget-lines returns 200 (with projectId param)")
        void listBudgetLines() throws Exception {
            mockMvc.perform(get("/api/budget-lines")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "00000000-0000-0000-0000-000000000000")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/cost-forecasts returns 200 (with projectId param)")
        void listCostForecasts() throws Exception {
            mockMvc.perform(get("/api/cost-forecasts")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "00000000-0000-0000-0000-000000000000")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("GET /api/cash-flow-projections returns 200 (with projectId param)")
        void listCashFlowProjections() throws Exception {
            mockMvc.perform(get("/api/cash-flow-projections")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "00000000-0000-0000-0000-000000000000")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Revenue Recognition
    // =========================================================================

    @Nested
    @DisplayName("Revenue Recognition endpoints")
    class RevenueRecognitionEndpoints {

        @Test
        @DisplayName("GET /api/revenue-contracts returns 200")
        void listRevenueContracts() throws Exception {
            mockMvc.perform(get("/api/revenue-contracts")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Organizations
    // =========================================================================

    @Nested
    @DisplayName("Organization endpoints")
    class OrganizationEndpoints {

        @Test
        @DisplayName("GET /api/organizations returns 200")
        void listOrganizations() throws Exception {
            mockMvc.perform(get("/api/organizations")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Specifications
    // =========================================================================

    @Nested
    @DisplayName("Specification endpoints")
    class SpecificationEndpoints {

        @Test
        @DisplayName("GET /api/specifications returns 200")
        void listSpecifications() throws Exception {
            mockMvc.perform(get("/api/specifications")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Estimates
    // =========================================================================

    @Nested
    @DisplayName("Estimate endpoints")
    class EstimateEndpoints {

        @Test
        @DisplayName("GET /api/estimates returns 200")
        void listEstimates() throws Exception {
            mockMvc.perform(get("/api/estimates")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // =========================================================================
    // Security
    // =========================================================================

    @Nested
    @DisplayName("Security smoke tests")
    class SecuritySmokeTests {

        @Test
        @DisplayName("Unauthenticated request to /api/projects is rejected")
        void unauthenticatedRejected() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Request with invalid token is rejected")
        void invalidTokenRejected() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer invalid.token.here")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Actuator health does not require authentication")
        void actuatorHealthPublic() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk());
        }
    }
}
