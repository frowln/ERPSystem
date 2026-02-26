package com.privod.platform.modules.closeout.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.closeout.domain.HandoverStatus;
import com.privod.platform.modules.closeout.service.HandoverPackageService;
import com.privod.platform.modules.closeout.web.dto.CreateHandoverPackageRequest;
import com.privod.platform.modules.closeout.web.dto.HandoverPackageResponse;
import com.privod.platform.modules.closeout.web.dto.UpdateHandoverPackageRequest;
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

@WebMvcTest(HandoverPackageController.class)
@AutoConfigureMockMvc(addFilters = false)
class HandoverPackageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HandoverPackageService handoverService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID packageId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    private HandoverPackageResponse buildResponse() {
        return new HandoverPackageResponse(
                packageId, projectId, "HP-001", "Пакет передачи корпуса А",
                "Описание", HandoverStatus.DRAFT, "Черновик",
                "ООО Заказчик", UUID.randomUUID(),
                UUID.randomUUID(), LocalDate.of(2025, 6, 1),
                LocalDate.of(2025, 7, 1), null, null,
                null, null, null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/handover-packages - should return paginated handover packages")
    void shouldReturnPaginatedHandoverPackages() throws Exception {
        HandoverPackageResponse response = buildResponse();
        Page<HandoverPackageResponse> page = new PageImpl<>(List.of(response));
        when(handoverService.findAll(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/handover-packages")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].packageNumber", is("HP-001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/handover-packages - should filter by projectId and status")
    void shouldFilterByProjectIdAndStatus() throws Exception {
        HandoverPackageResponse response = buildResponse();
        Page<HandoverPackageResponse> page = new PageImpl<>(List.of(response));
        when(handoverService.findAll(eq(projectId), eq(HandoverStatus.DRAFT), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/handover-packages")
                        .param("projectId", projectId.toString())
                        .param("status", "DRAFT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/handover-packages/{id} - should return handover package by ID")
    void shouldReturnHandoverPackageById() throws Exception {
        HandoverPackageResponse response = buildResponse();
        when(handoverService.findById(packageId)).thenReturn(response);

        mockMvc.perform(get("/api/handover-packages/{id}", packageId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(packageId.toString())))
                .andExpect(jsonPath("$.data.title", is("Пакет передачи корпуса А")))
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/handover-packages/{id} - should return 404 when not found")
    void shouldReturn404_whenPackageNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(handoverService.findById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Пакет передачи не найден"));

        mockMvc.perform(get("/api/handover-packages/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/handover-packages - should create handover package")
    void shouldCreateHandoverPackage() throws Exception {
        CreateHandoverPackageRequest request = new CreateHandoverPackageRequest(
                projectId, "HP-002", "Новый пакет",
                "Описание", "ООО Заказчик", null,
                null, null, null, null, null, null, null);

        HandoverPackageResponse response = buildResponse();
        when(handoverService.create(any(CreateHandoverPackageRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/handover-packages")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/handover-packages/{id} - should update handover package")
    void shouldUpdateHandoverPackage() throws Exception {
        UpdateHandoverPackageRequest request = new UpdateHandoverPackageRequest(
                null, "Обновлённый пакет", null, null,
                null, null, null, null, null, null, null,
                null, null, null, null, null);

        HandoverPackageResponse response = buildResponse();
        when(handoverService.update(eq(packageId), any(UpdateHandoverPackageRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/handover-packages/{id}", packageId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/handover-packages/{id} - should soft delete handover package")
    void shouldDeleteHandoverPackage() throws Exception {
        doNothing().when(handoverService).delete(packageId);

        mockMvc.perform(delete("/api/handover-packages/{id}", packageId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/handover-packages/{id} - should return 404 when deleting non-existent")
    void shouldReturn404_whenDeletingNonExistent() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new EntityNotFoundException("Пакет передачи не найден"))
                .when(handoverService).delete(nonExistentId);

        mockMvc.perform(delete("/api/handover-packages/{id}", nonExistentId)
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
