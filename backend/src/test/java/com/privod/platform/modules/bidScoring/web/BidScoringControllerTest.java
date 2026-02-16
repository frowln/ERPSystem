package com.privod.platform.modules.bidScoring.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import com.privod.platform.modules.bidScoring.domain.CriteriaType;
import com.privod.platform.modules.bidScoring.service.BidScoringService;
import com.privod.platform.modules.bidScoring.web.dto.BidComparisonResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidCriteriaResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidScoreResponse;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.VendorTotalScoreResponse;
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
import java.util.List;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BidScoringController.class)
@AutoConfigureMockMvc(addFilters = false)
class BidScoringControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BidScoringService bidScoringService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID comparisonId = UUID.randomUUID();
    private final UUID criteriaId = UUID.randomUUID();
    private final UUID scoreId = UUID.randomUUID();
    private final UUID vendorId = UUID.randomUUID();

    private BidComparisonResponse buildComparisonResponse() {
        return new BidComparisonResponse(
                comparisonId, UUID.randomUUID(), "Test Comparison", "Description",
                ComparisonStatus.DRAFT, "Черновик", "RFQ-001", "Materials",
                UUID.randomUUID(), null, null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    // ======================== BidComparison Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons - should return paginated comparisons")
    void shouldListComparisons() throws Exception {
        BidComparisonResponse response = buildComparisonResponse();
        Page<BidComparisonResponse> page = new PageImpl<>(List.of(response));
        when(bidScoringService.listComparisons(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/bid-scoring/comparisons")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title", is("Test Comparison")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{id} - should return comparison by ID")
    void shouldGetComparisonById() throws Exception {
        BidComparisonResponse response = buildComparisonResponse();
        when(bidScoringService.getComparison(comparisonId)).thenReturn(response);

        mockMvc.perform(get("/api/bid-scoring/comparisons/{id}", comparisonId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(comparisonId.toString())));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{id} - should return 404 when not found")
    void shouldReturn404_whenComparisonNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(bidScoringService.getComparison(nonExistentId))
                .thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get("/api/bid-scoring/comparisons/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/bid-scoring/comparisons - should create comparison")
    void shouldCreateComparison() throws Exception {
        CreateBidComparisonRequest request = new CreateBidComparisonRequest(
                UUID.randomUUID(), "New Comparison", "Desc", "RFQ-002",
                "Equipment", UUID.randomUUID());

        BidComparisonResponse response = buildComparisonResponse();
        when(bidScoringService.createComparison(any(CreateBidComparisonRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/bid-scoring/comparisons")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/bid-scoring/comparisons/{id}/start - should start comparison")
    void shouldStartComparison() throws Exception {
        BidComparisonResponse response = buildComparisonResponse();
        when(bidScoringService.startComparison(comparisonId)).thenReturn(response);

        mockMvc.perform(post("/api/bid-scoring/comparisons/{id}/start", comparisonId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/bid-scoring/comparisons/{id}/complete - should complete comparison")
    void shouldCompleteComparison() throws Exception {
        BidComparisonResponse response = buildComparisonResponse();
        when(bidScoringService.completeComparison(comparisonId)).thenReturn(response);

        mockMvc.perform(post("/api/bid-scoring/comparisons/{id}/complete", comparisonId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/bid-scoring/comparisons/{id}/approve - should approve comparison")
    void shouldApproveComparison() throws Exception {
        BidComparisonResponse response = buildComparisonResponse();
        UUID approvedById = UUID.randomUUID();
        when(bidScoringService.approveComparison(comparisonId, approvedById)).thenReturn(response);

        mockMvc.perform(post("/api/bid-scoring/comparisons/{id}/approve", comparisonId)
                        .with(csrf())
                        .param("approvedById", approvedById.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/bid-scoring/comparisons/{id} - should soft delete comparison")
    void shouldDeleteComparison() throws Exception {
        doNothing().when(bidScoringService).deleteComparison(comparisonId);

        mockMvc.perform(delete("/api/bid-scoring/comparisons/{id}", comparisonId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // ======================== BidCriteria Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{comparisonId}/criteria - should return criteria list")
    void shouldListCriteria() throws Exception {
        BidCriteriaResponse criteriaResponse = new BidCriteriaResponse(
                criteriaId, comparisonId, CriteriaType.PRICE, "Цена",
                "Price criteria", null, new BigDecimal("40"), 10, 1,
                Instant.now(), Instant.now());
        when(bidScoringService.listCriteria(comparisonId)).thenReturn(List.of(criteriaResponse));

        mockMvc.perform(get("/api/bid-scoring/comparisons/{comparisonId}/criteria", comparisonId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/bid-scoring/criteria - should create criteria")
    void shouldCreateCriteria() throws Exception {
        CreateBidCriteriaRequest request = new CreateBidCriteriaRequest(
                comparisonId, CriteriaType.QUALITY, "Quality", "Desc",
                new BigDecimal("30"), 10, 2);

        BidCriteriaResponse response = new BidCriteriaResponse(
                criteriaId, comparisonId, CriteriaType.QUALITY, "Качество",
                "Quality", "Desc", new BigDecimal("30"), 10, 2,
                Instant.now(), Instant.now());
        when(bidScoringService.createCriteria(any(CreateBidCriteriaRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/bid-scoring/criteria")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    // ======================== BidScore Endpoints ========================

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{comparisonId}/scores - should return scores list")
    void shouldListScores() throws Exception {
        BidScoreResponse scoreResponse = new BidScoreResponse(
                scoreId, comparisonId, criteriaId, vendorId, "Vendor A",
                new BigDecimal("8"), new BigDecimal("32"), "Good",
                UUID.randomUUID(), Instant.now(),
                Instant.now(), Instant.now());
        when(bidScoringService.listScores(comparisonId)).thenReturn(List.of(scoreResponse));

        mockMvc.perform(get("/api/bid-scoring/comparisons/{comparisonId}/scores", comparisonId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{comparisonId}/ranking - should return ranking")
    void shouldGetVendorRanking() throws Exception {
        VendorTotalScoreResponse ranking = new VendorTotalScoreResponse(
                vendorId, "Vendor A", new BigDecimal("85.00"));
        when(bidScoringService.getVendorRanking(comparisonId)).thenReturn(List.of(ranking));

        mockMvc.perform(get("/api/bid-scoring/comparisons/{comparisonId}/ranking", comparisonId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].vendorName", is("Vendor A")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/bid-scoring/comparisons/{comparisonId}/winner - should return winner")
    void shouldGetWinner() throws Exception {
        VendorTotalScoreResponse winner = new VendorTotalScoreResponse(
                vendorId, "Winner Vendor", new BigDecimal("92.00"));
        when(bidScoringService.determineWinner(comparisonId)).thenReturn(winner);

        mockMvc.perform(get("/api/bid-scoring/comparisons/{comparisonId}/winner", comparisonId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.vendorName", is("Winner Vendor")));
    }
}
