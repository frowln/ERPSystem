package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.ResourceAllocation;
import com.privod.platform.modules.planning.domain.ResourceType;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.repository.ResourceAllocationRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateResourceAllocationRequest;
import com.privod.platform.modules.planning.web.dto.ResourceAllocationResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceAllocationServiceTest {

    @Mock
    private ResourceAllocationRepository allocationRepository;

    @Mock
    private WbsNodeRepository wbsNodeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ResourceAllocationService resourceAllocationService;

    private UUID allocationId;
    private UUID wbsNodeId;
    private ResourceAllocation testAllocation;
    private WbsNode testNode;

    @BeforeEach
    void setUp() {
        allocationId = UUID.randomUUID();
        wbsNodeId = UUID.randomUUID();

        testNode = WbsNode.builder()
                .projectId(UUID.randomUUID())
                .code("WBS-1.1")
                .name("Foundation Work")
                .nodeType(WbsNodeType.ACTIVITY)
                .build();
        testNode.setId(wbsNodeId);
        testNode.setCreatedAt(Instant.now());

        testAllocation = ResourceAllocation.builder()
                .wbsNodeId(wbsNodeId)
                .resourceType(ResourceType.LABOR)
                .resourceName("Construction Workers")
                .plannedUnits(new BigDecimal("100"))
                .actualUnits(BigDecimal.ZERO)
                .unitRate(new BigDecimal("5000"))
                .plannedCost(new BigDecimal("500000"))
                .actualCost(BigDecimal.ZERO)
                .startDate(LocalDate.of(2025, 3, 1))
                .endDate(LocalDate.of(2025, 6, 30))
                .build();
        testAllocation.setId(allocationId);
        testAllocation.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Resource Allocation")
    class CreateTests {

        @Test
        @DisplayName("Should create allocation when WBS node exists")
        void shouldCreateAllocation_whenValidInput() {
            when(wbsNodeRepository.findById(wbsNodeId)).thenReturn(Optional.of(testNode));

            CreateResourceAllocationRequest request = new CreateResourceAllocationRequest(
                    wbsNodeId, ResourceType.EQUIPMENT, UUID.randomUUID(),
                    "Crane", new BigDecimal("10"), null,
                    new BigDecimal("50000"), new BigDecimal("500000"), null,
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 5, 31));

            when(allocationRepository.save(any(ResourceAllocation.class))).thenAnswer(inv -> {
                ResourceAllocation a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ResourceAllocationResponse response = resourceAllocationService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.resourceType()).isEqualTo(ResourceType.EQUIPMENT);
            assertThat(response.resourceName()).isEqualTo("Crane");
            assertThat(response.actualUnits()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("ResourceAllocation"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when WBS node not found")
        void shouldThrowException_whenWbsNodeNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(wbsNodeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            CreateResourceAllocationRequest request = new CreateResourceAllocationRequest(
                    nonExistentId, ResourceType.LABOR, null, "Workers",
                    new BigDecimal("50"), null, new BigDecimal("2000"),
                    new BigDecimal("100000"), null, null, null);

            assertThatThrownBy(() -> resourceAllocationService.create(request))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should reject when end date is before start date")
        void shouldThrowException_whenEndDateBeforeStartDate() {
            when(wbsNodeRepository.findById(wbsNodeId)).thenReturn(Optional.of(testNode));

            CreateResourceAllocationRequest request = new CreateResourceAllocationRequest(
                    wbsNodeId, ResourceType.MATERIAL, null, "Concrete",
                    new BigDecimal("100"), null, new BigDecimal("500"),
                    new BigDecimal("50000"), null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1));

            assertThatThrownBy(() -> resourceAllocationService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("позже");
        }

        @Test
        @DisplayName("Should set default zero for actual units and cost when not provided")
        void shouldSetDefaults_whenActualValuesNotProvided() {
            when(wbsNodeRepository.findById(wbsNodeId)).thenReturn(Optional.of(testNode));

            CreateResourceAllocationRequest request = new CreateResourceAllocationRequest(
                    wbsNodeId, ResourceType.LABOR, null, "Workers",
                    new BigDecimal("50"), null, new BigDecimal("2000"),
                    new BigDecimal("100000"), null, null, null);

            when(allocationRepository.save(any(ResourceAllocation.class))).thenAnswer(inv -> {
                ResourceAllocation a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ResourceAllocationResponse response = resourceAllocationService.create(request);

            assertThat(response.actualUnits()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.actualCost()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Read Resource Allocation")
    class ReadTests {

        @Test
        @DisplayName("Should find allocation by ID")
        void shouldReturnAllocation_whenFound() {
            when(allocationRepository.findById(allocationId)).thenReturn(Optional.of(testAllocation));

            ResourceAllocationResponse response = resourceAllocationService.findById(allocationId);

            assertThat(response).isNotNull();
            assertThat(response.resourceName()).isEqualTo("Construction Workers");
        }

        @Test
        @DisplayName("Should throw when allocation not found")
        void shouldThrowException_whenAllocationNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(allocationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> resourceAllocationService.findById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return paginated allocations for WBS node")
        void shouldReturnPagedAllocations_forWbsNode() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ResourceAllocation> page = new PageImpl<>(List.of(testAllocation));
            when(allocationRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId, pageable)).thenReturn(page);

            Page<ResourceAllocationResponse> result = resourceAllocationService.findByWbsNode(wbsNodeId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should return all allocations list for WBS node")
        void shouldReturnAllAllocations_forWbsNode() {
            when(allocationRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId))
                    .thenReturn(List.of(testAllocation));

            List<ResourceAllocationResponse> result = resourceAllocationService.findAllByWbsNode(wbsNodeId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).resourceName()).isEqualTo("Construction Workers");
        }
    }

    @Nested
    @DisplayName("Delete Resource Allocation")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete allocation")
        void shouldSoftDeleteAllocation() {
            when(allocationRepository.findById(allocationId)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.save(any(ResourceAllocation.class))).thenReturn(testAllocation);

            resourceAllocationService.delete(allocationId);

            assertThat(testAllocation.isDeleted()).isTrue();
            verify(auditService).logDelete("ResourceAllocation", allocationId);
        }
    }
}
