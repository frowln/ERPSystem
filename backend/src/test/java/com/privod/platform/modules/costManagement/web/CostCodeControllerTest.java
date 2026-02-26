package com.privod.platform.modules.costManagement.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.costManagement.domain.CostCodeLevel;
import com.privod.platform.modules.costManagement.service.CostCodeService;
import com.privod.platform.modules.costManagement.web.dto.CostCodeResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCostCodeRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

@WebMvcTest(CostCodeController.class)
@AutoConfigureMockMvc(addFilters = false)
class CostCodeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CostCodeService costCodeService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID costCodeId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    private CostCodeResponse buildResponse() {
        return new CostCodeResponse(
                costCodeId, projectId, "01.001", "Общестроительные работы",
                "Описание", null, CostCodeLevel.LEVEL2, "Уровень 2",
                new BigDecimal("15000000.00"), true,
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/cost-codes?projectId= - should return paginated cost codes")
    void shouldReturnPaginatedCostCodes() throws Exception {
        CostCodeResponse response = buildResponse();
        Page<CostCodeResponse> page = new PageImpl<>(List.of(response));
        when(costCodeService.listByProject(eq(projectId), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/cost-codes")
                        .param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("01.001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/cost-codes/all?projectId= - should return all cost codes without pagination")
    void shouldReturnAllCostCodes() throws Exception {
        CostCodeResponse response = buildResponse();
        when(costCodeService.listAllByProject(projectId)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/cost-codes/all")
                        .param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].code", is("01.001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/cost-codes/{id} - should return cost code by ID")
    void shouldReturnCostCodeById() throws Exception {
        CostCodeResponse response = buildResponse();
        when(costCodeService.getById(costCodeId)).thenReturn(response);

        mockMvc.perform(get("/api/cost-codes/{id}", costCodeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(costCodeId.toString())))
                .andExpect(jsonPath("$.data.code", is("01.001")))
                .andExpect(jsonPath("$.data.levelDisplayName", is("Уровень 2")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/cost-codes/{id} - should return 404 when not found")
    void shouldReturn404_whenCostCodeNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(costCodeService.getById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Код затрат не найден"));

        mockMvc.perform(get("/api/cost-codes/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/cost-codes/{id}/children - should return child cost codes")
    void shouldReturnChildCostCodes() throws Exception {
        CostCodeResponse child = new CostCodeResponse(
                UUID.randomUUID(), projectId, "01.001.01", "Бетонные работы",
                null, costCodeId, CostCodeLevel.LEVEL3, "Уровень 3",
                new BigDecimal("5000000.00"), true,
                Instant.now(), Instant.now(), "admin@privod.ru");
        when(costCodeService.getChildren(costCodeId)).thenReturn(List.of(child));

        mockMvc.perform(get("/api/cost-codes/{id}/children", costCodeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].code", is("01.001.01")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/cost-codes - should create cost code")
    void shouldCreateCostCode() throws Exception {
        CreateCostCodeRequest request = new CreateCostCodeRequest(
                projectId, "02.001", "Земляные работы",
                "Описание", null, null, new BigDecimal("2000000"));

        CostCodeResponse response = buildResponse();
        when(costCodeService.create(any(CreateCostCodeRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/cost-codes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/cost-codes - should return 400 for duplicate code")
    void shouldReturn400_whenDuplicateCode() throws Exception {
        CreateCostCodeRequest request = new CreateCostCodeRequest(
                projectId, "01.001", "Дубликат", null, null, null, null);

        when(costCodeService.create(any(CreateCostCodeRequest.class)))
                .thenThrow(new IllegalArgumentException("Код затрат с кодом '01.001' уже существует"));

        mockMvc.perform(post("/api/cost-codes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/cost-codes/{id} - should update cost code")
    void shouldUpdateCostCode() throws Exception {
        UpdateCostCodeRequest request = new UpdateCostCodeRequest(
                null, "Обновлённое название", null, null, null, null, null);

        CostCodeResponse response = buildResponse();
        when(costCodeService.update(eq(costCodeId), any(UpdateCostCodeRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/cost-codes/{id}", costCodeId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/cost-codes/{id} - should soft delete cost code")
    void shouldDeleteCostCode() throws Exception {
        doNothing().when(costCodeService).delete(costCodeId);

        mockMvc.perform(delete("/api/cost-codes/{id}", costCodeId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
