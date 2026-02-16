package com.privod.platform.modules.changeManagement.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.service.ChangeEventService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventFromRfiRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeEventRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChangeEventController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChangeEventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChangeEventService changeEventService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID eventId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    private ChangeEventResponse buildResponse() {
        return new ChangeEventResponse(
                eventId, projectId, "CE-00001", "Обнаружение коммуникаций",
                "Описание", ChangeEventSource.FIELD_CONDITION, "Полевые условия",
                ChangeEventStatus.IDENTIFIED, "Выявлено",
                UUID.randomUUID(), LocalDate.of(2025, 3, 15),
                new BigDecimal("500000.00"), 14,
                null, null, null, null, null, null,
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-events - should return paginated change events")
    void shouldReturnPaginatedChangeEvents() throws Exception {
        ChangeEventResponse response = buildResponse();
        Page<ChangeEventResponse> page = new PageImpl<>(List.of(response));
        when(changeEventService.listChangeEvents(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/change-events")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].number", is("CE-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-events/{id} - should return change event by ID")
    void shouldReturnChangeEventById() throws Exception {
        ChangeEventResponse response = buildResponse();
        when(changeEventService.getChangeEvent(eventId)).thenReturn(response);

        mockMvc.perform(get("/api/change-events/{id}", eventId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(eventId.toString())))
                .andExpect(jsonPath("$.data.number", is("CE-00001")))
                .andExpect(jsonPath("$.data.status", is("IDENTIFIED")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-events/{id} - should return 404 when not found")
    void shouldReturn404_whenChangeEventNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(changeEventService.getChangeEvent(nonExistentId))
                .thenThrow(new EntityNotFoundException("Событие изменения не найдено"));

        mockMvc.perform(get("/api/change-events/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/change-events - should create change event")
    void shouldCreateChangeEvent() throws Exception {
        CreateChangeEventRequest request = new CreateChangeEventRequest(
                projectId, "Новое событие", "Описание",
                ChangeEventSource.DESIGN_CHANGE, UUID.randomUUID(),
                LocalDate.now(), new BigDecimal("100000"), 5,
                null, null, null, null);

        ChangeEventResponse response = buildResponse();
        when(changeEventService.createChangeEvent(any(CreateChangeEventRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/change-events")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.number", is("CE-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/change-events/from-rfi - should create change event from RFI")
    void shouldCreateChangeEventFromRfi() throws Exception {
        UUID rfiId = UUID.randomUUID();
        CreateChangeEventFromRfiRequest request = new CreateChangeEventFromRfiRequest(
                rfiId, projectId, "Изменение по RFI",
                "Описание", UUID.randomUUID(),
                LocalDate.now(), null, null, null);

        ChangeEventResponse response = buildResponse();
        when(changeEventService.createFromRfi(any(CreateChangeEventFromRfiRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/change-events/from-rfi")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/change-events/{id} - should update change event")
    void shouldUpdateChangeEvent() throws Exception {
        UpdateChangeEventRequest request = new UpdateChangeEventRequest(
                "Обновлённое", null, null, null, null,
                null, null, null, null, null, null);

        ChangeEventResponse response = buildResponse();
        when(changeEventService.updateChangeEvent(eq(eventId), any(UpdateChangeEventRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/change-events/{id}", eventId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/change-events/{id}/status - should change status")
    void shouldChangeStatus() throws Exception {
        ChangeEventStatusRequest request = new ChangeEventStatusRequest(ChangeEventStatus.UNDER_REVIEW);

        ChangeEventResponse response = buildResponse();
        when(changeEventService.changeStatus(eq(eventId), any(ChangeEventStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/change-events/{id} - should soft delete change event")
    void shouldDeleteChangeEvent() throws Exception {
        doNothing().when(changeEventService).deleteChangeEvent(eventId);

        mockMvc.perform(delete("/api/change-events/{id}", eventId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/change-events/{id}/status - should return 400 on invalid transition")
    void shouldReturn400_whenInvalidStatusTransition() throws Exception {
        ChangeEventStatusRequest request = new ChangeEventStatusRequest(ChangeEventStatus.APPROVED);
        when(changeEventService.changeStatus(eq(eventId), any(ChangeEventStatusRequest.class)))
                .thenThrow(new IllegalStateException("Невозможно перевести"));

        mockMvc.perform(patch("/api/change-events/{id}/status", eventId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
