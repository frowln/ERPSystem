package com.privod.platform.modules.portfolio.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.portfolio.domain.BidStatus;
import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;
import com.privod.platform.modules.portfolio.service.PortfolioService;
import com.privod.platform.modules.portfolio.web.dto.BidPackageResponse;
import com.privod.platform.modules.portfolio.web.dto.ChangeOpportunityStageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateTenderSubmissionRequest;
import com.privod.platform.modules.portfolio.web.dto.OpportunityResponse;
import com.privod.platform.modules.portfolio.web.dto.PortfolioDashboardResponse;
import com.privod.platform.modules.portfolio.web.dto.PrequalificationResponse;
import com.privod.platform.modules.portfolio.web.dto.TenderSubmissionResponse;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PortfolioController.class)
@AutoConfigureMockMvc(addFilters = false)
class PortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortfolioService portfolioService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID opportunityId = UUID.randomUUID();
    private final UUID bidPackageId = UUID.randomUUID();
    private final UUID prequalificationId = UUID.randomUUID();
    private final UUID tenderSubmissionId = UUID.randomUUID();

    private OpportunityResponse buildOpportunityResponse() {
        return new OpportunityResponse(
                opportunityId, UUID.randomUUID(), "Test Opportunity", "Description",
                "Client", ClientType.COMMERCIAL, "Коммерческий",
                OpportunityStage.LEAD, "Лид",
                new BigDecimal("5000000"), 30,
                LocalDate.of(2025, 12, 31), null,
                UUID.randomUUID(), "Website", "Moscow", "Office",
                null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    private BidPackageResponse buildBidPackageResponse() {
        return new BidPackageResponse(
                bidPackageId, opportunityId, "Bid Project",
                BidStatus.DRAFT, "Черновик", "BID-001",
                "Client Org", LocalDateTime.of(2025, 6, 30, 17, 0), null,
                new BigDecimal("3000000"), new BigDecimal("2500000"),
                new BigDecimal("500000"), UUID.randomUUID(), UUID.randomUUID(),
                false, null, null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    private PrequalificationResponse buildPrequalificationResponse() {
        return new PrequalificationResponse(
                prequalificationId, UUID.randomUUID(), "PQ Client", "PQ Project",
                PrequalificationStatus.DRAFT, "Черновик",
                LocalDate.of(2025, 6, 1), LocalDate.of(2026, 6, 1),
                null, new BigDecimal("10000000"), UUID.randomUUID(),
                null, "Notes", false,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    // ======================== Opportunity Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/portfolio/opportunities - should return paginated opportunities")
    void shouldListOpportunities() throws Exception {
        OpportunityResponse response = buildOpportunityResponse();
        Page<OpportunityResponse> page = new PageImpl<>(List.of(response));
        when(portfolioService.listOpportunities(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/portfolio/opportunities")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Test Opportunity")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/portfolio/opportunities/{id} - should return opportunity by ID")
    void shouldGetOpportunityById() throws Exception {
        OpportunityResponse response = buildOpportunityResponse();
        when(portfolioService.getOpportunity(opportunityId)).thenReturn(response);

        mockMvc.perform(get("/api/portfolio/opportunities/{id}", opportunityId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(opportunityId.toString())))
                .andExpect(jsonPath("$.data.stage", is("LEAD")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/portfolio/opportunities/{id} - should return 404 when not found")
    void shouldReturn404_whenOpportunityNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(portfolioService.getOpportunity(nonExistentId))
                .thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get("/api/portfolio/opportunities/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/portfolio/opportunities - should create opportunity")
    void shouldCreateOpportunity() throws Exception {
        CreateOpportunityRequest request = new CreateOpportunityRequest(
                UUID.randomUUID(), "New Opportunity", null,
                null, ClientType.DEVELOPER, new BigDecimal("1000000"),
                50, null, null, null, null, null, null);

        OpportunityResponse response = buildOpportunityResponse();
        when(portfolioService.createOpportunity(any(CreateOpportunityRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/portfolio/opportunities")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/portfolio/opportunities/{id}/stage - should change stage")
    void shouldChangeOpportunityStage() throws Exception {
        ChangeOpportunityStageRequest request = new ChangeOpportunityStageRequest(
                OpportunityStage.QUALIFICATION, null, null);
        OpportunityResponse response = buildOpportunityResponse();
        when(portfolioService.changeStage(eq(opportunityId), any(ChangeOpportunityStageRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/portfolio/opportunities/{id}/stage", opportunityId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/portfolio/opportunities/{id} - should soft delete opportunity")
    void shouldDeleteOpportunity() throws Exception {
        doNothing().when(portfolioService).deleteOpportunity(opportunityId);

        mockMvc.perform(delete("/api/portfolio/opportunities/{id}", opportunityId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // ======================== Dashboard Endpoint ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/portfolio/dashboard - should return dashboard stats")
    void shouldGetDashboard() throws Exception {
        PortfolioDashboardResponse dashboard = new PortfolioDashboardResponse(
                15L,
                Map.of("LEAD", 5L, "WON", 3L),
                new BigDecimal("50000000"),
                3L, 8L, new BigDecimal("37.50"));
        when(portfolioService.getDashboard(any())).thenReturn(dashboard);

        mockMvc.perform(get("/api/portfolio/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalOpportunities", is(15)))
                .andExpect(jsonPath("$.data.stageCounts.LEAD", is(5)));
    }

    // ======================== Bid Package Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/portfolio/bid-packages - should return paginated bid packages")
    void shouldListBidPackages() throws Exception {
        BidPackageResponse response = buildBidPackageResponse();
        Page<BidPackageResponse> page = new PageImpl<>(List.of(response));
        when(portfolioService.listBidPackages(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/portfolio/bid-packages")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/portfolio/bid-packages - should create bid package")
    void shouldCreateBidPackage() throws Exception {
        CreateBidPackageRequest request = new CreateBidPackageRequest(
                opportunityId, "New Bid", "BID-002", "Client",
                LocalDateTime.of(2025, 6, 30, 17, 0),
                new BigDecimal("2000000"), new BigDecimal("1500000"),
                new BigDecimal("500000"), UUID.randomUUID(), UUID.randomUUID(),
                true, new BigDecimal("100000"), null, null, "notes");

        BidPackageResponse response = buildBidPackageResponse();
        when(portfolioService.createBidPackage(any(CreateBidPackageRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/portfolio/bid-packages")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/portfolio/bid-packages/{id} - should soft delete bid package")
    void shouldDeleteBidPackage() throws Exception {
        doNothing().when(portfolioService).deleteBidPackage(bidPackageId);

        mockMvc.perform(delete("/api/portfolio/bid-packages/{id}", bidPackageId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // ======================== Prequalification Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/portfolio/prequalifications - should create prequalification")
    void shouldCreatePrequalification() throws Exception {
        CreatePrequalificationRequest request = new CreatePrequalificationRequest(
                UUID.randomUUID(), "PQ Client", "PQ Project",
                LocalDate.of(2025, 6, 1), LocalDate.of(2026, 6, 1),
                null, new BigDecimal("8000000"), UUID.randomUUID(), null, "Notes");

        PrequalificationResponse response = buildPrequalificationResponse();
        when(portfolioService.createPrequalification(any(CreatePrequalificationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/portfolio/prequalifications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // ======================== Tender Submission Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/portfolio/tender-submissions - should create tender submission")
    void shouldCreateTenderSubmission() throws Exception {
        CreateTenderSubmissionRequest request = new CreateTenderSubmissionRequest(
                bidPackageId, "Tech", "Commercial",
                new BigDecimal("1000000"), new BigDecimal("10"),
                null, UUID.randomUUID(), null);

        TenderSubmissionResponse response = new TenderSubmissionResponse(
                tenderSubmissionId, bidPackageId, 1, "Tech", "Commercial",
                new BigDecimal("1000000"), new BigDecimal("10"), new BigDecimal("900000"),
                UUID.randomUUID(), Instant.now(), null,
                Instant.now(), Instant.now(), "admin@privod.ru");
        when(portfolioService.createTenderSubmission(any(CreateTenderSubmissionRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/portfolio/tender-submissions")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/portfolio/tender-submissions/{id} - should soft delete tender submission")
    void shouldDeleteTenderSubmission() throws Exception {
        doNothing().when(portfolioService).deleteTenderSubmission(tenderSubmissionId);

        mockMvc.perform(delete("/api/portfolio/tender-submissions/{id}", tenderSubmissionId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
