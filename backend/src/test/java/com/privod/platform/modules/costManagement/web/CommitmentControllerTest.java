package com.privod.platform.modules.costManagement.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.domain.CommitmentType;
import com.privod.platform.modules.costManagement.service.CommitmentService;
import com.privod.platform.modules.costManagement.web.dto.ChangeCommitmentStatusRequest;
import com.privod.platform.modules.costManagement.web.dto.CommitmentItemResponse;
import com.privod.platform.modules.costManagement.web.dto.CommitmentResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentItemRequest;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCommitmentRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CommitmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class CommitmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommitmentService commitmentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID commitmentId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    private CommitmentResponse buildResponse() {
        return new CommitmentResponse(
                commitmentId, projectId, "CMT-00001", "Субподряд на электромонтаж",
                CommitmentType.SUBCONTRACT, "Субподряд",
                CommitmentStatus.DRAFT, "Черновик",
                UUID.randomUUID(), UUID.randomUUID(),
                new BigDecimal("5000000.00"), new BigDecimal("5000000.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("5.00"), new BigDecimal("5000000.00"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 9, 30),
                null, Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commitments?projectId= - should return paginated commitments")
    void shouldReturnPaginatedCommitments() throws Exception {
        CommitmentResponse response = buildResponse();
        Page<CommitmentResponse> page = new PageImpl<>(List.of(response));
        when(commitmentService.listByProject(eq(projectId), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/commitments")
                        .param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].number", is("CMT-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commitments/{id} - should return commitment by ID")
    void shouldReturnCommitmentById() throws Exception {
        CommitmentResponse response = buildResponse();
        when(commitmentService.getById(commitmentId)).thenReturn(response);

        mockMvc.perform(get("/api/commitments/{id}", commitmentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(commitmentId.toString())))
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commitments/{id} - should return 404 when not found")
    void shouldReturn404_whenCommitmentNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(commitmentService.getById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Обязательство не найдено"));

        mockMvc.perform(get("/api/commitments/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/commitments - should create commitment")
    void shouldCreateCommitment() throws Exception {
        CreateCommitmentRequest request = new CreateCommitmentRequest(
                projectId, "Новое обязательство", CommitmentType.PURCHASE_ORDER,
                UUID.randomUUID(), null,
                new BigDecimal("3000000"), new BigDecimal("10"),
                LocalDate.of(2025, 4, 1), LocalDate.of(2025, 8, 31), null);

        CommitmentResponse response = buildResponse();
        when(commitmentService.create(any(CreateCommitmentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/commitments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.number", is("CMT-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/commitments/{id} - should update commitment")
    void shouldUpdateCommitment() throws Exception {
        UpdateCommitmentRequest request = new UpdateCommitmentRequest(
                "Обновлённое обязательство", null, null, null, null, null, null, null, null, null);

        CommitmentResponse response = buildResponse();
        when(commitmentService.update(eq(commitmentId), any(UpdateCommitmentRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/commitments/{id}", commitmentId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/commitments/{id}/status - should change commitment status")
    void shouldChangeCommitmentStatus() throws Exception {
        ChangeCommitmentStatusRequest request = new ChangeCommitmentStatusRequest(CommitmentStatus.ISSUED);

        CommitmentResponse response = buildResponse();
        when(commitmentService.changeStatus(eq(commitmentId), any(ChangeCommitmentStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/commitments/{id}/status", commitmentId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/commitments/{id}/change-orders - should add change order")
    void shouldAddChangeOrder() throws Exception {
        CommitmentResponse response = buildResponse();
        when(commitmentService.addChangeOrder(eq(commitmentId), any(BigDecimal.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/commitments/{id}/change-orders", commitmentId)
                        .with(csrf())
                        .param("amount", "500000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commitments/{id}/items - should return commitment items")
    void shouldReturnCommitmentItems() throws Exception {
        CommitmentItemResponse itemResponse = new CommitmentItemResponse(
                UUID.randomUUID(), commitmentId, "Электрокабель",
                UUID.randomUUID(), new BigDecimal("500"), "м.п.",
                new BigDecimal("200.00"), new BigDecimal("100000.00"),
                BigDecimal.ZERO, 1, Instant.now(), Instant.now());

        when(commitmentService.listItems(commitmentId)).thenReturn(List.of(itemResponse));

        mockMvc.perform(get("/api/commitments/{id}/items", commitmentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].description", is("Электрокабель")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/commitments/{id}/items - should add item to commitment")
    void shouldAddItemToCommitment() throws Exception {
        CreateCommitmentItemRequest request = new CreateCommitmentItemRequest(
                "Трубы ПВХ", UUID.randomUUID(),
                new BigDecimal("200"), "шт.", new BigDecimal("500.00"), 2);

        CommitmentItemResponse response = new CommitmentItemResponse(
                UUID.randomUUID(), commitmentId, "Трубы ПВХ",
                UUID.randomUUID(), new BigDecimal("200"), "шт.",
                new BigDecimal("500.00"), new BigDecimal("100000.00"),
                BigDecimal.ZERO, 2, Instant.now(), Instant.now());

        when(commitmentService.addItem(eq(commitmentId), any(CreateCommitmentItemRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/commitments/{id}/items", commitmentId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.description", is("Трубы ПВХ")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/commitments/{id} - should soft delete commitment")
    void shouldDeleteCommitment() throws Exception {
        doNothing().when(commitmentService).delete(commitmentId);

        mockMvc.perform(delete("/api/commitments/{id}", commitmentId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
