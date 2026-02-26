package com.privod.platform.modules.planning.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.JwtAuthenticationFilter;
import com.privod.platform.infrastructure.security.JwtTokenProvider;
import com.privod.platform.modules.planning.domain.DependencyType;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.service.EvmSnapshotService;
import com.privod.platform.modules.planning.service.ResourceAllocationService;
import com.privod.platform.modules.planning.service.ScheduleBaselineService;
import com.privod.platform.modules.planning.service.WbsDependencyService;
import com.privod.platform.modules.planning.service.WbsNodeService;
import com.privod.platform.modules.planning.web.dto.CreateWbsDependencyRequest;
import com.privod.platform.modules.planning.web.dto.CreateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.CreateEvmSnapshotRequest;
import com.privod.platform.modules.planning.web.dto.EvmSnapshotResponse;
import com.privod.platform.modules.planning.web.dto.WbsDependencyResponse;
import com.privod.platform.modules.planning.web.dto.WbsNodeResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
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

@WebMvcTest({WbsNodeController.class, WbsDependencyController.class, EvmSnapshotController.class})
@AutoConfigureMockMvc(addFilters = false)
class PlanningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WbsNodeService wbsNodeService;

    @MockBean
    private WbsDependencyService wbsDependencyService;

    @MockBean
    private EvmSnapshotService evmSnapshotService;

    @MockBean
    private ScheduleBaselineService scheduleBaselineService;

    @MockBean
    private ResourceAllocationService resourceAllocationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final UUID projectId = UUID.randomUUID();
    private final UUID nodeId = UUID.randomUUID();
    private final UUID snapshotId = UUID.randomUUID();

    private WbsNodeResponse buildNodeResponse() {
        return new WbsNodeResponse(
                nodeId, projectId, null, "WBS-1.1", "Foundation Work",
                WbsNodeType.ACTIVITY, "Работа", 2, 1,
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 6, 30),
                null, null, 120, BigDecimal.ZERO,
                null, null, false, null, null,
                null, null, null, null,
                Instant.now(), Instant.now());
    }

    private EvmSnapshotResponse buildEvmResponse() {
        return new EvmSnapshotResponse(
                snapshotId, projectId,
                LocalDate.of(2025, 6, 30), LocalDate.of(2025, 6, 30),
                new BigDecimal("10000000"), new BigDecimal("5000000"),
                new BigDecimal("4500000"), new BigDecimal("5200000"),
                new BigDecimal("0.8654"), new BigDecimal("0.9000"),
                new BigDecimal("11555305"), new BigDecimal("6355305"),
                new BigDecimal("1.1458"), new BigDecimal("45"),
                180, "Monthly snapshot",
                Instant.now(), Instant.now());
    }

    // ======================== WBS Node Endpoints ========================

    @Nested
    @DisplayName("WBS Node Controller")
    class WbsNodeTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/wbs-nodes - should return paginated WBS nodes")
        void shouldListNodes() throws Exception {
            WbsNodeResponse response = buildNodeResponse();
            Page<WbsNodeResponse> page = new PageImpl<>(List.of(response));
            when(wbsNodeService.findByProject(eq(projectId), any(Pageable.class))).thenReturn(page);

            mockMvc.perform(get("/api/wbs-nodes")
                            .param("projectId", projectId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.content", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/wbs-nodes/{id} - should return WBS node by ID")
        void shouldGetNodeById() throws Exception {
            WbsNodeResponse response = buildNodeResponse();
            when(wbsNodeService.findById(nodeId)).thenReturn(response);

            mockMvc.perform(get("/api/wbs-nodes/{id}", nodeId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.name", is("Foundation Work")));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/wbs-nodes/{id} - should return 404 when not found")
        void shouldReturn404_whenNodeNotFound() throws Exception {
            UUID nonExistentId = UUID.randomUUID();
            when(wbsNodeService.findById(nonExistentId))
                    .thenThrow(new EntityNotFoundException("Not found"));

            mockMvc.perform(get("/api/wbs-nodes/{id}", nonExistentId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("POST /api/wbs-nodes - should create WBS node")
        void shouldCreateNode() throws Exception {
            CreateWbsNodeRequest request = new CreateWbsNodeRequest(
                    projectId, null, "WBS-1.2", "Structural Work",
                    WbsNodeType.ACTIVITY, 2, 2,
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 12, 31),
                    180, null, null, null);

            WbsNodeResponse response = buildNodeResponse();
            when(wbsNodeService.create(any(CreateWbsNodeRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/wbs-nodes")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/wbs-nodes/tree - should return root tree nodes")
        void shouldGetTree() throws Exception {
            WbsNodeResponse response = buildNodeResponse();
            when(wbsNodeService.findTree(projectId)).thenReturn(List.of(response));

            mockMvc.perform(get("/api/wbs-nodes/tree")
                            .param("projectId", projectId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/wbs-nodes/critical-path - should return critical path nodes")
        void shouldGetCriticalPath() throws Exception {
            WbsNodeResponse response = buildNodeResponse();
            when(wbsNodeService.findCriticalPath(projectId)).thenReturn(List.of(response));

            mockMvc.perform(get("/api/wbs-nodes/critical-path")
                            .param("projectId", projectId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("DELETE /api/wbs-nodes/{id} - should soft delete WBS node")
        void shouldDeleteNode() throws Exception {
            doNothing().when(wbsNodeService).delete(nodeId);

            mockMvc.perform(delete("/api/wbs-nodes/{id}", nodeId)
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }

    // ======================== EVM Snapshot Endpoints ========================

    @Nested
    @DisplayName("EVM Snapshot Controller")
    class EvmTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/evm-snapshots - should return paginated EVM snapshots")
        void shouldListSnapshots() throws Exception {
            EvmSnapshotResponse response = buildEvmResponse();
            Page<EvmSnapshotResponse> page = new PageImpl<>(List.of(response));
            when(evmSnapshotService.findByProject(eq(projectId), any(Pageable.class))).thenReturn(page);

            mockMvc.perform(get("/api/evm-snapshots")
                            .param("projectId", projectId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.content", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/evm-snapshots/{id} - should return EVM snapshot by ID")
        void shouldGetSnapshotById() throws Exception {
            EvmSnapshotResponse response = buildEvmResponse();
            when(evmSnapshotService.findById(snapshotId)).thenReturn(response);

            mockMvc.perform(get("/api/evm-snapshots/{id}", snapshotId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.criticalPathLength", is(180)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("GET /api/evm-snapshots/latest - should return latest snapshot")
        void shouldGetLatestSnapshot() throws Exception {
            EvmSnapshotResponse response = buildEvmResponse();
            when(evmSnapshotService.findLatest(projectId)).thenReturn(Optional.of(response));

            mockMvc.perform(get("/api/evm-snapshots/latest")
                            .param("projectId", projectId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("POST /api/evm-snapshots - should create EVM snapshot")
        void shouldCreateSnapshot() throws Exception {
            CreateEvmSnapshotRequest request = new CreateEvmSnapshotRequest(
                    projectId, LocalDate.of(2025, 6, 30), null,
                    new BigDecimal("10000000"), new BigDecimal("5000000"),
                    new BigDecimal("4500000"), new BigDecimal("5200000"),
                    new BigDecimal("45"), 180, null);

            EvmSnapshotResponse response = buildEvmResponse();
            when(evmSnapshotService.create(any(CreateEvmSnapshotRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/evm-snapshots")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("DELETE /api/evm-snapshots/{id} - should soft delete snapshot")
        void shouldDeleteSnapshot() throws Exception {
            doNothing().when(evmSnapshotService).delete(snapshotId);

            mockMvc.perform(delete("/api/evm-snapshots/{id}", snapshotId)
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));
        }
    }
}
