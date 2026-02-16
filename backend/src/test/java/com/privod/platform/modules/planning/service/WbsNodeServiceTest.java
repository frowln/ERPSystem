package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.UpdateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.WbsNodeResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class WbsNodeServiceTest {

    @Mock
    private WbsNodeRepository wbsNodeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WbsNodeService wbsNodeService;

    private UUID nodeId;
    private UUID projectId;
    private WbsNode testNode;

    @BeforeEach
    void setUp() {
        nodeId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testNode = WbsNode.builder()
                .projectId(projectId)
                .code("WBS-1.1")
                .name("Foundation Work")
                .nodeType(WbsNodeType.ACTIVITY)
                .level(2)
                .sortOrder(1)
                .plannedStartDate(LocalDate.of(2025, 3, 1))
                .plannedEndDate(LocalDate.of(2025, 6, 30))
                .duration(120)
                .percentComplete(BigDecimal.ZERO)
                .build();
        testNode.setId(nodeId);
        testNode.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create WBS Node")
    class CreateTests {

        @Test
        @DisplayName("Should create WBS node with default ACTIVITY type")
        void shouldCreateNode_whenValidInput() {
            CreateWbsNodeRequest request = new CreateWbsNodeRequest(
                    projectId, null, "WBS-1.2", "Structural Work",
                    null, 2, 2,
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 12, 31),
                    180, null, null, null);

            when(wbsNodeRepository.save(any(WbsNode.class))).thenAnswer(inv -> {
                WbsNode n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            WbsNodeResponse response = wbsNodeService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.nodeType()).isEqualTo(WbsNodeType.ACTIVITY);
            assertThat(response.name()).isEqualTo("Structural Work");
            assertThat(response.percentComplete()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("WbsNode"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create WBS node with specific node type")
        void shouldCreateNode_withSpecificType() {
            CreateWbsNodeRequest request = new CreateWbsNodeRequest(
                    projectId, null, "WBS-1", "Phase 1",
                    WbsNodeType.PHASE, 1, 1,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                    365, null, null, null);

            when(wbsNodeRepository.save(any(WbsNode.class))).thenAnswer(inv -> {
                WbsNode n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            WbsNodeResponse response = wbsNodeService.create(request);

            assertThat(response.nodeType()).isEqualTo(WbsNodeType.PHASE);
        }

        @Test
        @DisplayName("Should validate parent exists when parentId is provided")
        void shouldThrowException_whenParentNotFound() {
            UUID nonExistentParentId = UUID.randomUUID();
            CreateWbsNodeRequest request = new CreateWbsNodeRequest(
                    projectId, nonExistentParentId, "WBS-1.1.1", "Sub-task",
                    null, 3, 1, null, null, null, null, null, null);

            when(wbsNodeRepository.findById(nonExistentParentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wbsNodeService.create(request))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should reject when end date is before start date")
        void shouldThrowException_whenEndDateBeforeStartDate() {
            CreateWbsNodeRequest request = new CreateWbsNodeRequest(
                    projectId, null, "WBS-1.3", "Invalid Dates",
                    null, 2, 3,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1),
                    null, null, null, null);

            assertThatThrownBy(() -> wbsNodeService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("позже");
        }
    }

    @Nested
    @DisplayName("Read WBS Node")
    class ReadTests {

        @Test
        @DisplayName("Should find WBS node by ID")
        void shouldReturnNode_whenFound() {
            when(wbsNodeRepository.findById(nodeId)).thenReturn(Optional.of(testNode));

            WbsNodeResponse response = wbsNodeService.findById(nodeId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("WBS-1.1");
            assertThat(response.name()).isEqualTo("Foundation Work");
        }

        @Test
        @DisplayName("Should throw when WBS node not found")
        void shouldThrowException_whenNodeNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(wbsNodeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wbsNodeService.findById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when WBS node is deleted")
        void shouldThrowException_whenNodeDeleted() {
            testNode.softDelete();
            when(wbsNodeRepository.findById(nodeId)).thenReturn(Optional.of(testNode));

            assertThatThrownBy(() -> wbsNodeService.findById(nodeId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return paginated nodes for project")
        void shouldReturnPagedNodes_forProject() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<WbsNode> page = new PageImpl<>(List.of(testNode));
            when(wbsNodeRepository.findByProjectIdAndDeletedFalse(projectId, pageable))
                    .thenReturn(page);

            Page<WbsNodeResponse> result = wbsNodeService.findByProject(projectId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("Foundation Work");
        }

        @Test
        @DisplayName("Should return root tree nodes for project")
        void shouldReturnTreeNodes_forProject() {
            when(wbsNodeRepository.findRootNodesByProjectId(projectId))
                    .thenReturn(List.of(testNode));

            List<WbsNodeResponse> result = wbsNodeService.findTree(projectId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return children for a parent node")
        void shouldReturnChildren_forParent() {
            UUID parentId = UUID.randomUUID();
            when(wbsNodeRepository.findByParentIdAndDeletedFalseOrderBySortOrder(parentId))
                    .thenReturn(List.of(testNode));

            List<WbsNodeResponse> result = wbsNodeService.findChildren(parentId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return critical path nodes")
        void shouldReturnCriticalPathNodes() {
            testNode.setIsCritical(true);
            when(wbsNodeRepository.findByProjectIdAndIsCriticalTrueAndDeletedFalse(projectId))
                    .thenReturn(List.of(testNode));

            List<WbsNodeResponse> result = wbsNodeService.findCriticalPath(projectId);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Update WBS Node")
    class UpdateTests {

        @Test
        @DisplayName("Should update WBS node fields selectively")
        void shouldUpdateNode_whenValidFields() {
            when(wbsNodeRepository.findById(nodeId)).thenReturn(Optional.of(testNode));
            when(wbsNodeRepository.save(any(WbsNode.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWbsNodeRequest request = new UpdateWbsNodeRequest(
                    null, "WBS-1.1-UPD", "Updated Foundation",
                    WbsNodeType.WORK_PACKAGE, null, null,
                    null, null, null, null, null,
                    new BigDecimal("50"), null, null);

            WbsNodeResponse response = wbsNodeService.update(nodeId, request);

            assertThat(response.code()).isEqualTo("WBS-1.1-UPD");
            assertThat(response.name()).isEqualTo("Updated Foundation");
            assertThat(response.nodeType()).isEqualTo(WbsNodeType.WORK_PACKAGE);
            assertThat(response.percentComplete()).isEqualByComparingTo("50");
            verify(auditService).logUpdate(eq("WbsNode"), eq(nodeId), eq("multiple"), any(), any());
        }

        @Test
        @DisplayName("Should reject self-referencing parent")
        void shouldThrowException_whenNodeIsOwnParent() {
            when(wbsNodeRepository.findById(nodeId)).thenReturn(Optional.of(testNode));

            UpdateWbsNodeRequest request = new UpdateWbsNodeRequest(
                    nodeId, null, null, null, null, null,
                    null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> wbsNodeService.update(nodeId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("родителем самого себя");
        }
    }

    @Nested
    @DisplayName("Delete WBS Node")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete WBS node")
        void shouldSoftDeleteNode() {
            when(wbsNodeRepository.findById(nodeId)).thenReturn(Optional.of(testNode));
            when(wbsNodeRepository.save(any(WbsNode.class))).thenReturn(testNode);

            wbsNodeService.delete(nodeId);

            assertThat(testNode.isDeleted()).isTrue();
            verify(auditService).logDelete("WbsNode", nodeId);
        }
    }
}
