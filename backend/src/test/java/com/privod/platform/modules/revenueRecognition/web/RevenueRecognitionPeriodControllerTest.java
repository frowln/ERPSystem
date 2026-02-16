package com.privod.platform.modules.revenueRecognition.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.service.RevenueRecognitionPeriodService;
import com.privod.platform.modules.revenueRecognition.web.dto.CalculatePeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.ChangePeriodStatusRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRecognitionPeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueRecognitionPeriodResponse;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RevenueRecognitionPeriodController.class)
@AutoConfigureMockMvc(addFilters = false)
class RevenueRecognitionPeriodControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RevenueRecognitionPeriodService periodService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID periodId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();

    private RevenueRecognitionPeriodResponse buildPeriodResponse() {
        return new RevenueRecognitionPeriodResponse(
                periodId, contractId,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 3, 31),
                PeriodStatus.OPEN, "Открыт",
                new BigDecimal("2000000"), null, null, null,
                null, null, null, null, BigDecimal.ZERO,
                "Q1 period", null, null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-recognition-periods - should return paginated periods")
    void shouldListPeriods() throws Exception {
        RevenueRecognitionPeriodResponse response = buildPeriodResponse();
        Page<RevenueRecognitionPeriodResponse> page = new PageImpl<>(List.of(response));
        when(periodService.listPeriods(eq(contractId), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/revenue-recognition-periods")
                        .param("revenueContractId", contractId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].status", is("OPEN")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-recognition-periods/{id} - should return period by ID")
    void shouldGetPeriodById() throws Exception {
        RevenueRecognitionPeriodResponse response = buildPeriodResponse();
        when(periodService.getPeriod(periodId)).thenReturn(response);

        mockMvc.perform(get("/api/revenue-recognition-periods/{id}", periodId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(periodId.toString())));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-recognition-periods/{id} - should return 404 when not found")
    void shouldReturn404_whenPeriodNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(periodService.getPeriod(nonExistentId))
                .thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get("/api/revenue-recognition-periods/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/revenue-recognition-periods - should create period")
    void shouldCreatePeriod() throws Exception {
        CreateRecognitionPeriodRequest request = new CreateRecognitionPeriodRequest(
                contractId,
                LocalDate.of(2025, 4, 1), LocalDate.of(2025, 6, 30),
                null, "Q2");

        RevenueRecognitionPeriodResponse response = buildPeriodResponse();
        when(periodService.createPeriod(any(CreateRecognitionPeriodRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/revenue-recognition-periods")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/revenue-recognition-periods/{id}/calculate - should calculate period")
    void shouldCalculatePeriod() throws Exception {
        CalculatePeriodRequest request = new CalculatePeriodRequest(
                new BigDecimal("3000000"), UUID.randomUUID());

        RevenueRecognitionPeriodResponse response = new RevenueRecognitionPeriodResponse(
                periodId, contractId,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 3, 31),
                PeriodStatus.CALCULATED, "Рассчитан",
                new BigDecimal("3000000"), new BigDecimal("3750000"),
                new BigDecimal("3000000"), new BigDecimal("3750000"),
                new BigDecimal("37.5000"), new BigDecimal("5000000"),
                new BigDecimal("2000000"), BigDecimal.ZERO, BigDecimal.ZERO,
                null, UUID.randomUUID(), null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru");
        when(periodService.calculatePeriod(eq(periodId), any(CalculatePeriodRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/revenue-recognition-periods/{id}/calculate", periodId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CALCULATED")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/revenue-recognition-periods/{id}/status - should change period status")
    void shouldChangeStatus() throws Exception {
        ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                PeriodStatus.CALCULATED, null);

        RevenueRecognitionPeriodResponse response = buildPeriodResponse();
        when(periodService.changeStatus(eq(periodId), any(ChangePeriodStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/revenue-recognition-periods/{id}/status", periodId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/revenue-recognition-periods/{id} - should soft delete period")
    void shouldDeletePeriod() throws Exception {
        doNothing().when(periodService).deletePeriod(periodId);

        mockMvc.perform(delete("/api/revenue-recognition-periods/{id}", periodId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/revenue-recognition-periods/{id} - should return error when deleting POSTED period")
    void shouldReturnError_whenDeletingPostedPeriod() throws Exception {
        doThrow(new IllegalStateException("Cannot delete"))
                .when(periodService).deletePeriod(periodId);

        mockMvc.perform(delete("/api/revenue-recognition-periods/{id}", periodId)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
