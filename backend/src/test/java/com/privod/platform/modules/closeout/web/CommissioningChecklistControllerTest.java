package com.privod.platform.modules.closeout.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.service.CommissioningChecklistService;
import com.privod.platform.modules.closeout.web.dto.CommissioningChecklistResponse;
import com.privod.platform.modules.closeout.web.dto.CreateCommissioningChecklistRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateCommissioningChecklistRequest;
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

@WebMvcTest(CommissioningChecklistController.class)
@AutoConfigureMockMvc(addFilters = false)
class CommissioningChecklistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommissioningChecklistService checklistService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID checklistId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    private CommissioningChecklistResponse buildResponse() {
        return new CommissioningChecklistResponse(
                checklistId, projectId, "Проверка системы вентиляции", "HVAC",
                ChecklistStatus.NOT_STARTED, "Не начат",
                "[{\"item\":\"Проверка воздуховодов\",\"done\":false}]",
                UUID.randomUUID(), LocalDate.of(2025, 8, 1),
                null, null,
                "Заметки", null,
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commissioning-checklists - should return paginated checklists")
    void shouldReturnPaginatedChecklists() throws Exception {
        CommissioningChecklistResponse response = buildResponse();
        Page<CommissioningChecklistResponse> page = new PageImpl<>(List.of(response));
        when(checklistService.findAll(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/commissioning-checklists")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Проверка системы вентиляции")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commissioning-checklists - should filter by projectId, status and system")
    void shouldFilterByParams() throws Exception {
        CommissioningChecklistResponse response = buildResponse();
        Page<CommissioningChecklistResponse> page = new PageImpl<>(List.of(response));
        when(checklistService.findAll(eq(projectId), eq(ChecklistStatus.NOT_STARTED), eq("HVAC"), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/commissioning-checklists")
                        .param("projectId", projectId.toString())
                        .param("status", "NOT_STARTED")
                        .param("system", "HVAC")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commissioning-checklists/{id} - should return checklist by ID")
    void shouldReturnChecklistById() throws Exception {
        CommissioningChecklistResponse response = buildResponse();
        when(checklistService.findById(checklistId)).thenReturn(response);

        mockMvc.perform(get("/api/commissioning-checklists/{id}", checklistId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(checklistId.toString())))
                .andExpect(jsonPath("$.data.system", is("HVAC")))
                .andExpect(jsonPath("$.data.status", is("NOT_STARTED")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/commissioning-checklists/{id} - should return 404 when not found")
    void shouldReturn404_whenChecklistNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(checklistService.findById(nonExistentId))
                .thenThrow(new EntityNotFoundException("Пусконаладочный чек-лист не найден"));

        mockMvc.perform(get("/api/commissioning-checklists/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/commissioning-checklists - should create checklist")
    void shouldCreateChecklist() throws Exception {
        CreateCommissioningChecklistRequest request = new CreateCommissioningChecklistRequest(
                projectId, "Проверка электросистемы", "Электрика",
                null, UUID.randomUUID(), LocalDate.now(), "Заметки", null);

        CommissioningChecklistResponse response = buildResponse();
        when(checklistService.create(any(CreateCommissioningChecklistRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/commissioning-checklists")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/commissioning-checklists/{id} - should update checklist")
    void shouldUpdateChecklist() throws Exception {
        UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                "Обновлённый", null, null, null,
                null, null, null, null, null);

        CommissioningChecklistResponse response = buildResponse();
        when(checklistService.update(eq(checklistId), any(UpdateCommissioningChecklistRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/commissioning-checklists/{id}", checklistId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/commissioning-checklists/{id} - should soft delete checklist")
    void shouldDeleteChecklist() throws Exception {
        doNothing().when(checklistService).delete(checklistId);

        mockMvc.perform(delete("/api/commissioning-checklists/{id}", checklistId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/commissioning-checklists/{id} - should return 404 when deleting non-existent")
    void shouldReturn404_whenDeletingNonExistent() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new EntityNotFoundException("Пусконаладочный чек-лист не найден"))
                .when(checklistService).delete(nonExistentId);

        mockMvc.perform(delete("/api/commissioning-checklists/{id}", nonExistentId)
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
