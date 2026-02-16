package com.privod.platform.modules.changeManagement.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderType;
import com.privod.platform.modules.changeManagement.service.ChangeOrderService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderItemResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderItemRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequest;
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

@WebMvcTest(ChangeOrderController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChangeOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChangeOrderService changeOrderService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID orderId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();

    private ChangeOrderResponse buildResponse() {
        return new ChangeOrderResponse(
                orderId, projectId, contractId, "CO-00001",
                "Дополнительное соглашение", "Описание",
                ChangeOrderType.ADDITION, "Дополнение",
                ChangeOrderStatus.DRAFT, "Черновик",
                new BigDecimal("450000.00"), 10,
                new BigDecimal("5000000.00"), new BigDecimal("5450000.00"),
                null, null, null, UUID.randomUUID(),
                Instant.now(), Instant.now(), "admin@privod.ru"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders?projectId= - should return paginated change orders")
    void shouldReturnPaginatedChangeOrders() throws Exception {
        ChangeOrderResponse response = buildResponse();
        Page<ChangeOrderResponse> page = new PageImpl<>(List.of(response));
        when(changeOrderService.listByProject(eq(projectId), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/change-orders")
                        .param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].number", is("CO-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders/by-contract/{contractId} - should return orders by contract")
    void shouldReturnChangeOrdersByContract() throws Exception {
        ChangeOrderResponse response = buildResponse();
        Page<ChangeOrderResponse> page = new PageImpl<>(List.of(response));
        when(changeOrderService.listByContract(eq(contractId), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/change-orders/by-contract/{contractId}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders/{id} - should return change order by ID")
    void shouldReturnChangeOrderById() throws Exception {
        ChangeOrderResponse response = buildResponse();
        when(changeOrderService.getChangeOrder(orderId)).thenReturn(response);

        mockMvc.perform(get("/api/change-orders/{id}", orderId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(orderId.toString())))
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders/{id} - should return 404 when not found")
    void shouldReturn404_whenOrderNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(changeOrderService.getChangeOrder(nonExistentId))
                .thenThrow(new EntityNotFoundException("Ордер на изменение не найден"));

        mockMvc.perform(get("/api/change-orders/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/change-orders - should create change order")
    void shouldCreateChangeOrder() throws Exception {
        CreateChangeOrderRequest request = new CreateChangeOrderRequest(
                projectId, contractId, "Допсоглашение",
                "Описание", ChangeOrderType.ADDITION,
                new BigDecimal("5000000"), 10, null);

        ChangeOrderResponse response = buildResponse();
        when(changeOrderService.createChangeOrder(any(CreateChangeOrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/change-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.number", is("CO-00001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/change-orders/{id} - should update change order")
    void shouldUpdateChangeOrder() throws Exception {
        UpdateChangeOrderRequest request = new UpdateChangeOrderRequest(
                "Обновлённый", null, null, null, null);

        ChangeOrderResponse response = buildResponse();
        when(changeOrderService.updateChangeOrder(eq(orderId), any(UpdateChangeOrderRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/change-orders/{id}", orderId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PATCH /api/change-orders/{id}/status - should change status")
    void shouldChangeStatus() throws Exception {
        ChangeOrderStatusRequest request = new ChangeOrderStatusRequest(
                ChangeOrderStatus.PENDING_APPROVAL, null);

        ChangeOrderResponse response = buildResponse();
        when(changeOrderService.changeStatus(eq(orderId), any(ChangeOrderStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/change-orders/{id}/status", orderId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/change-orders/{id} - should soft delete change order")
    void shouldDeleteChangeOrder() throws Exception {
        doNothing().when(changeOrderService).deleteChangeOrder(orderId);

        mockMvc.perform(delete("/api/change-orders/{id}", orderId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders/{id}/items - should return change order items")
    void shouldReturnChangeOrderItems() throws Exception {
        ChangeOrderItemResponse itemResponse = new ChangeOrderItemResponse(
                UUID.randomUUID(), orderId, "Демонтаж",
                new BigDecimal("100"), "м.п.", new BigDecimal("1500.00"),
                new BigDecimal("150000.00"), null, null, 1,
                Instant.now(), Instant.now());

        when(changeOrderService.listItems(orderId)).thenReturn(List.of(itemResponse));

        mockMvc.perform(get("/api/change-orders/{id}/items", orderId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].description", is("Демонтаж")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/change-orders/{id}/items - should add item to change order")
    void shouldAddItemToChangeOrder() throws Exception {
        CreateChangeOrderItemRequest request = new CreateChangeOrderItemRequest(
                orderId, "Монтаж трубопровода",
                new BigDecimal("50"), "м.п.",
                new BigDecimal("2000.00"), null, null, 2);

        ChangeOrderItemResponse response = new ChangeOrderItemResponse(
                UUID.randomUUID(), orderId, "Монтаж трубопровода",
                new BigDecimal("50"), "м.п.", new BigDecimal("2000.00"),
                new BigDecimal("100000.00"), null, null, 2,
                Instant.now(), Instant.now());

        when(changeOrderService.addItem(any(CreateChangeOrderItemRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/change-orders/{id}/items", orderId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.description", is("Монтаж трубопровода")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/change-orders/revised-amount - should return revised contract amount")
    void shouldReturnRevisedContractAmount() throws Exception {
        when(changeOrderService.calculateRevisedContractAmount(contractId, new BigDecimal("5000000")))
                .thenReturn(new BigDecimal("5700000.00"));

        mockMvc.perform(get("/api/change-orders/revised-amount")
                        .param("contractId", contractId.toString())
                        .param("originalAmount", "5000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
