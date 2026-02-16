package com.privod.platform.modules.revenueRecognition.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.service.RevenueContractService;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueContractRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueContractResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.UpdateRevenueContractRequest;
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
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RevenueContractController.class)
@AutoConfigureMockMvc(addFilters = false)
class RevenueContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RevenueContractService revenueContractService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID contractId = UUID.randomUUID();

    private RevenueContractResponse buildContractResponse() {
        return new RevenueContractResponse(
                contractId, UUID.randomUUID(), UUID.randomUUID(),
                "Construction Contract",
                RecognitionMethod.PERCENTAGE_OF_COMPLETION, "Процент завершения",
                RecognitionStandard.PBU_2_2008, "ПБУ 2/2008",
                new BigDecimal("10000000"), new BigDecimal("8000000"),
                UUID.randomUUID(),
                LocalDate.of(2025, 1, 1), LocalDate.of(2027, 12, 31),
                true, false, new BigDecimal("2000000"), BigDecimal.ZERO,
                Instant.now(), Instant.now(), "admin@privod.ru");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-contracts - should return paginated contracts")
    void shouldListContracts() throws Exception {
        RevenueContractResponse response = buildContractResponse();
        Page<RevenueContractResponse> page = new PageImpl<>(List.of(response));
        when(revenueContractService.listContracts(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/revenue-contracts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].contractName", is("Construction Contract")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-contracts/{id} - should return contract by ID")
    void shouldGetContractById() throws Exception {
        RevenueContractResponse response = buildContractResponse();
        when(revenueContractService.getContract(contractId)).thenReturn(response);

        mockMvc.perform(get("/api/revenue-contracts/{id}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(contractId.toString())))
                .andExpect(jsonPath("$.data.lossContract", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/revenue-contracts/{id} - should return 404 when not found")
    void shouldReturn404_whenContractNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(revenueContractService.getContract(nonExistentId))
                .thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get("/api/revenue-contracts/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/revenue-contracts - should create contract")
    void shouldCreateContract() throws Exception {
        CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                UUID.randomUUID(), UUID.randomUUID(), "New Contract",
                null, null,
                new BigDecimal("5000000"), new BigDecimal("4000000"),
                UUID.randomUUID(), null, null);

        RevenueContractResponse response = buildContractResponse();
        when(revenueContractService.createContract(any(CreateRevenueContractRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/revenue-contracts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/revenue-contracts/{id} - should update contract")
    void shouldUpdateContract() throws Exception {
        UpdateRevenueContractRequest request = new UpdateRevenueContractRequest(
                null, "Updated Name", null, null, null, null, null, null, null);

        RevenueContractResponse response = buildContractResponse();
        when(revenueContractService.updateContract(eq(contractId), any(UpdateRevenueContractRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/revenue-contracts/{id}", contractId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/revenue-contracts/{id} - should soft delete contract")
    void shouldDeleteContract() throws Exception {
        doNothing().when(revenueContractService).deleteContract(contractId);

        mockMvc.perform(delete("/api/revenue-contracts/{id}", contractId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
