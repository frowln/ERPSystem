package com.privod.platform.modules.closeout.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import com.privod.platform.modules.closeout.service.WarrantyClaimService;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyClaimResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WarrantyClaimController.class)
@AutoConfigureMockMvc(addFilters = false)
class WarrantyClaimControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WarrantyClaimService warrantyService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID claimId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID handoverPackageId = UUID.randomUUID();

    private WarrantyClaimResponse buildResponse() {
        return new WarrantyClaimResponse(
                claimId, projectId, handoverPackageId, "WC-001",
                "Трещина в фундаменте",
                "Обнаружена трещина шириной 2мм",
                WarrantyClaimStatus.OPEN, "Открыт",
                "Структурный дефект", "Корпус А, секция 3",
                UUID.randomUUID(), LocalDate.of(2025, 9, 1),
                LocalDate.of(2027, 9, 1), UUID.randomUUID(),
                null, null, new BigDecimal("150000.00"),
                null, Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/warranty-claims - should return paginated warranty claims")
    void shouldReturnPaginatedWarrantyClaims() throws Exception {
        WarrantyClaimResponse response = buildResponse();
        Page<WarrantyClaimResponse> page = new PageImpl<>(List.of(response));
        when(warrantyService.findAll(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/warranty-claims")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].claimNumber", is("WC-001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/warranty-claims - should filter by projectId, status, and handoverPackageId")
    void shouldFilterByParams() throws Exception {
        WarrantyClaimResponse response = buildResponse();
        Page<WarrantyClaimResponse> page = new PageImpl<>(List.of(response));
        when(warrantyService.findAll(
                eq(projectId), eq(WarrantyClaimStatus.OPEN), eq(handoverPackageId), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/warranty-claims")
                        .param("projectId", projectId.toString())
                        .param("status", "OPEN")
                        .param("handoverPackageId", handoverPackageId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/warranty-claims/{id} - should return warranty claim by ID")
    void shouldReturnWarrantyClaimById() throws Exception {
        WarrantyClaimResponse response = buildResponse();
        when(warrantyService.findById(claimId)).thenReturn(response);

        mockMvc.perform(get("/api/warranty-claims/{id}", claimId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(claimId.toString())))
                .andExpect(jsonPath("$.data.title", is("Трещина в фундаменте")))
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andExpect(jsonPath("$.data.defectType", is("Структурный дефект")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/warranty-claims/{id} - should return 404 when not found")
    void shouldReturn404_whenClaimNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(warrantyService.findById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Гарантийная рекламация не найдена"));

        mockMvc.perform(get("/api/warranty-claims/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/warranty-claims - should create warranty claim")
    void shouldCreateWarrantyClaim() throws Exception {
        CreateWarrantyClaimRequest request = new CreateWarrantyClaimRequest(
                projectId, handoverPackageId, "WC-002",
                "Протечка кровли", "Описание",
                "Гидроизоляция", "Корпус Б",
                UUID.randomUUID(), LocalDate.now(),
                LocalDate.now().plusYears(2), null,
                new BigDecimal("75000.00"), null);

        WarrantyClaimResponse response = buildResponse();
        when(warrantyService.create(any(CreateWarrantyClaimRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/warranty-claims")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/warranty-claims/{id} - should update warranty claim")
    void shouldUpdateWarrantyClaim() throws Exception {
        UpdateWarrantyClaimRequest request = new UpdateWarrantyClaimRequest(
                null, "Обновлённая рекламация", null, null,
                null, null, null, null, null, null, null);

        WarrantyClaimResponse response = buildResponse();
        when(warrantyService.update(eq(claimId), any(UpdateWarrantyClaimRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/warranty-claims/{id}", claimId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/warranty-claims/{id} - should soft delete warranty claim")
    void shouldDeleteWarrantyClaim() throws Exception {
        doNothing().when(warrantyService).delete(claimId);

        mockMvc.perform(delete("/api/warranty-claims/{id}", claimId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/warranty-claims/{id} - should return 404 when deleting non-existent")
    void shouldReturn404_whenDeletingNonExistent() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new EntityNotFoundException("Гарантийная рекламация не найдена"))
                .when(warrantyService).delete(nonExistentId);

        mockMvc.perform(delete("/api/warranty-claims/{id}", nonExistentId)
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
