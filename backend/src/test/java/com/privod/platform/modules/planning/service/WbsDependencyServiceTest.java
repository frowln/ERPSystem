package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.DependencyType;
import com.privod.platform.modules.planning.domain.WbsDependency;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.repository.WbsDependencyRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateWbsDependencyRequest;
import com.privod.platform.modules.planning.web.dto.WbsDependencyResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
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
class WbsDependencyServiceTest {

    @Mock
    private WbsDependencyRepository dependencyRepository;

    @Mock
    private WbsNodeRepository wbsNodeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WbsDependencyService wbsDependencyService;

    private UUID predecessorId;
    private UUID successorId;
    private UUID dependencyId;
    private WbsNode predecessorNode;
    private WbsNode successorNode;
    private WbsDependency testDependency;

    @BeforeEach
    void setUp() {
        predecessorId = UUID.randomUUID();
        successorId = UUID.randomUUID();
        dependencyId = UUID.randomUUID();

        predecessorNode = WbsNode.builder()
                .projectId(UUID.randomUUID())
                .code("WBS-1.1")
                .name("Task A")
                .nodeType(WbsNodeType.ACTIVITY)
                .build();
        predecessorNode.setId(predecessorId);
        predecessorNode.setCreatedAt(Instant.now());

        successorNode = WbsNode.builder()
                .projectId(UUID.randomUUID())
                .code("WBS-1.2")
                .name("Task B")
                .nodeType(WbsNodeType.ACTIVITY)
                .build();
        successorNode.setId(successorId);
        successorNode.setCreatedAt(Instant.now());

        testDependency = WbsDependency.builder()
                .predecessorId(predecessorId)
                .successorId(successorId)
                .dependencyType(DependencyType.FINISH_TO_START)
                .lagDays(0)
                .build();
        testDependency.setId(dependencyId);
        testDependency.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Dependency")
    class CreateTests {

        @Test
        @DisplayName("Should create dependency with default FINISH_TO_START type")
        void shouldCreateDependency_withDefaultType() {
            when(wbsNodeRepository.findById(predecessorId)).thenReturn(Optional.of(predecessorNode));
            when(wbsNodeRepository.findById(successorId)).thenReturn(Optional.of(successorNode));
            when(dependencyRepository.save(any(WbsDependency.class))).thenAnswer(inv -> {
                WbsDependency d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            CreateWbsDependencyRequest request = new CreateWbsDependencyRequest(
                    predecessorId, successorId, null, null);

            WbsDependencyResponse response = wbsDependencyService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.dependencyType()).isEqualTo(DependencyType.FINISH_TO_START);
            assertThat(response.lagDays()).isEqualTo(0);
            verify(auditService).logCreate(eq("WbsDependency"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create dependency with specific type and lag")
        void shouldCreateDependency_withSpecificTypeAndLag() {
            when(wbsNodeRepository.findById(predecessorId)).thenReturn(Optional.of(predecessorNode));
            when(wbsNodeRepository.findById(successorId)).thenReturn(Optional.of(successorNode));
            when(dependencyRepository.save(any(WbsDependency.class))).thenAnswer(inv -> {
                WbsDependency d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            CreateWbsDependencyRequest request = new CreateWbsDependencyRequest(
                    predecessorId, successorId, DependencyType.START_TO_START, 5);

            WbsDependencyResponse response = wbsDependencyService.create(request);

            assertThat(response.dependencyType()).isEqualTo(DependencyType.START_TO_START);
            assertThat(response.lagDays()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should reject self-dependency")
        void shouldThrowException_whenSelfDependency() {
            CreateWbsDependencyRequest request = new CreateWbsDependencyRequest(
                    predecessorId, predecessorId, null, null);

            assertThatThrownBy(() -> wbsDependencyService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("от самого себя");
        }

        @Test
        @DisplayName("Should throw when predecessor not found")
        void shouldThrowException_whenPredecessorNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(wbsNodeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            CreateWbsDependencyRequest request = new CreateWbsDependencyRequest(
                    nonExistentId, successorId, null, null);

            assertThatThrownBy(() -> wbsDependencyService.create(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("предшественник");
        }

        @Test
        @DisplayName("Should throw when successor not found")
        void shouldThrowException_whenSuccessorNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(wbsNodeRepository.findById(predecessorId)).thenReturn(Optional.of(predecessorNode));
            when(wbsNodeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            CreateWbsDependencyRequest request = new CreateWbsDependencyRequest(
                    predecessorId, nonExistentId, null, null);

            assertThatThrownBy(() -> wbsDependencyService.create(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("последователь");
        }
    }

    @Nested
    @DisplayName("Read Dependencies")
    class ReadTests {

        @Test
        @DisplayName("Should find predecessors for a node")
        void shouldFindPredecessors() {
            when(dependencyRepository.findBySuccessorIdAndDeletedFalse(successorId))
                    .thenReturn(List.of(testDependency));

            List<WbsDependencyResponse> result = wbsDependencyService.findPredecessors(successorId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).predecessorId()).isEqualTo(predecessorId);
        }

        @Test
        @DisplayName("Should find successors for a node")
        void shouldFindSuccessors() {
            when(dependencyRepository.findByPredecessorIdAndDeletedFalse(predecessorId))
                    .thenReturn(List.of(testDependency));

            List<WbsDependencyResponse> result = wbsDependencyService.findSuccessors(predecessorId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).successorId()).isEqualTo(successorId);
        }

        @Test
        @DisplayName("Should find dependencies by node ID")
        void shouldFindByNodeId() {
            when(dependencyRepository.findByNodeId(predecessorId))
                    .thenReturn(List.of(testDependency));

            List<WbsDependencyResponse> result = wbsDependencyService.findByNodeId(predecessorId);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Delete Dependency")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete dependency")
        void shouldSoftDeleteDependency() {
            when(dependencyRepository.findById(dependencyId)).thenReturn(Optional.of(testDependency));
            when(dependencyRepository.save(any(WbsDependency.class))).thenReturn(testDependency);

            wbsDependencyService.delete(dependencyId);

            assertThat(testDependency.isDeleted()).isTrue();
            verify(auditService).logDelete("WbsDependency", dependencyId);
        }

        @Test
        @DisplayName("Should throw when deleting non-existent dependency")
        void shouldThrowException_whenDependencyNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(dependencyRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wbsDependencyService.delete(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }
}
