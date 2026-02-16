package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CostCode;
import com.privod.platform.modules.costManagement.domain.CostCodeLevel;
import com.privod.platform.modules.costManagement.repository.CostCodeRepository;
import com.privod.platform.modules.costManagement.web.dto.CostCodeResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCostCodeRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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
class CostCodeServiceTest {

    @Mock
    private CostCodeRepository costCodeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CostCodeService costCodeService;

    private UUID costCodeId;
    private UUID projectId;
    private CostCode testCostCode;

    @BeforeEach
    void setUp() {
        costCodeId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testCostCode = CostCode.builder()
                .projectId(projectId)
                .code("01.001")
                .name("Общестроительные работы")
                .description("Основные строительные работы")
                .level(CostCodeLevel.LEVEL2)
                .budgetAmount(new BigDecimal("15000000.00"))
                .isActive(true)
                .build();
        testCostCode.setId(costCodeId);
        testCostCode.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Cost Code")
    class CreateCostCodeTests {

        @Test
        @DisplayName("Should create cost code with default level LEVEL1")
        void shouldCreate_withDefaultLevel() {
            CreateCostCodeRequest request = new CreateCostCodeRequest(
                    projectId, "01.002", "Земляные работы",
                    "Описание", null, null, new BigDecimal("2000000.00"));

            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "01.002"))
                    .thenReturn(false);
            when(costCodeRepository.save(any(CostCode.class))).thenAnswer(inv -> {
                CostCode cc = inv.getArgument(0);
                cc.setId(UUID.randomUUID());
                cc.setCreatedAt(Instant.now());
                return cc;
            });

            CostCodeResponse response = costCodeService.create(request);

            assertThat(response.level()).isEqualTo(CostCodeLevel.LEVEL1);
            assertThat(response.code()).isEqualTo("01.002");
            assertThat(response.budgetAmount()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            verify(auditService).logCreate(eq("CostCode"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate code in same project")
        void shouldThrowException_whenDuplicateCode() {
            CreateCostCodeRequest request = new CreateCostCodeRequest(
                    projectId, "01.001", "Дубликат", null, null, null, null);

            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "01.001"))
                    .thenReturn(true);

            assertThatThrownBy(() -> costCodeService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Код затрат с кодом '01.001' уже существует");
        }

        @Test
        @DisplayName("Should default budget amount to ZERO when null")
        void shouldDefaultBudget_whenNull() {
            CreateCostCodeRequest request = new CreateCostCodeRequest(
                    projectId, "02.001", "Работы", null, null, null, null);

            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "02.001"))
                    .thenReturn(false);
            when(costCodeRepository.save(any(CostCode.class))).thenAnswer(inv -> {
                CostCode cc = inv.getArgument(0);
                cc.setId(UUID.randomUUID());
                cc.setCreatedAt(Instant.now());
                return cc;
            });

            CostCodeResponse response = costCodeService.create(request);

            assertThat(response.budgetAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Cost Code Hierarchy")
    class CostCodeHierarchyTests {

        @Test
        @DisplayName("Should create child cost code with parent reference")
        void shouldCreate_withParent() {
            UUID parentId = costCodeId;

            CreateCostCodeRequest request = new CreateCostCodeRequest(
                    projectId, "01.001.01", "Бетонные работы",
                    null, parentId, CostCodeLevel.LEVEL3, null);

            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "01.001.01"))
                    .thenReturn(false);
            when(costCodeRepository.findById(parentId))
                    .thenReturn(Optional.of(testCostCode));
            when(costCodeRepository.save(any(CostCode.class))).thenAnswer(inv -> {
                CostCode cc = inv.getArgument(0);
                cc.setId(UUID.randomUUID());
                cc.setCreatedAt(Instant.now());
                return cc;
            });

            CostCodeResponse response = costCodeService.create(request);

            assertThat(response.parentId()).isEqualTo(parentId);
            assertThat(response.level()).isEqualTo(CostCodeLevel.LEVEL3);
        }

        @Test
        @DisplayName("Should get child cost codes")
        void shouldReturnChildren_whenParentExists() {
            CostCode child1 = CostCode.builder()
                    .projectId(projectId).code("01.001.01").name("Бетонные работы")
                    .parentId(costCodeId).level(CostCodeLevel.LEVEL3).build();
            child1.setId(UUID.randomUUID());
            child1.setCreatedAt(Instant.now());

            CostCode child2 = CostCode.builder()
                    .projectId(projectId).code("01.001.02").name("Арматурные работы")
                    .parentId(costCodeId).level(CostCodeLevel.LEVEL3).build();
            child2.setId(UUID.randomUUID());
            child2.setCreatedAt(Instant.now());

            when(costCodeRepository.findByParentIdAndDeletedFalse(costCodeId))
                    .thenReturn(List.of(child1, child2));

            List<CostCodeResponse> children = costCodeService.getChildren(costCodeId);

            assertThat(children).hasSize(2);
            assertThat(children.stream().map(CostCodeResponse::code).toList())
                    .containsExactlyInAnyOrder("01.001.01", "01.001.02");
        }

        @Test
        @DisplayName("Should reject parent that does not exist")
        void shouldThrowException_whenParentNotFound() {
            UUID nonExistentParent = UUID.randomUUID();
            CreateCostCodeRequest request = new CreateCostCodeRequest(
                    projectId, "99.001", "Ошибочный",
                    null, nonExistentParent, null, null);

            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "99.001"))
                    .thenReturn(false);
            when(costCodeRepository.findById(nonExistentParent))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> costCodeService.create(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Код затрат не найден");
        }
    }

    @Nested
    @DisplayName("Update Cost Code")
    class UpdateTests {

        @Test
        @DisplayName("Should update cost code name and budget")
        void shouldUpdate_whenValidInput() {
            when(costCodeRepository.findById(costCodeId)).thenReturn(Optional.of(testCostCode));
            when(costCodeRepository.save(any(CostCode.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCostCodeRequest request = new UpdateCostCodeRequest(
                    null, "Обновлённое название", null, null, null,
                    new BigDecimal("20000000.00"), null);

            CostCodeResponse response = costCodeService.update(costCodeId, request);

            assertThat(response.name()).isEqualTo("Обновлённое название");
            assertThat(response.budgetAmount()).isEqualByComparingTo(new BigDecimal("20000000.00"));
            verify(auditService).logUpdate(eq("CostCode"), eq(costCodeId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject duplicate code on update")
        void shouldThrowException_whenDuplicateCodeOnUpdate() {
            when(costCodeRepository.findById(costCodeId)).thenReturn(Optional.of(testCostCode));
            when(costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(projectId, "01.002"))
                    .thenReturn(true);

            UpdateCostCodeRequest request = new UpdateCostCodeRequest(
                    "01.002", null, null, null, null, null, null);

            assertThatThrownBy(() -> costCodeService.update(costCodeId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Код затрат с кодом '01.002' уже существует");
        }
    }

    @Test
    @DisplayName("Should find cost code by ID")
    void shouldReturnCostCode_whenExists() {
        when(costCodeRepository.findById(costCodeId)).thenReturn(Optional.of(testCostCode));

        CostCodeResponse response = costCodeService.getById(costCodeId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("01.001");
        assertThat(response.name()).isEqualTo("Общестроительные работы");
    }

    @Test
    @DisplayName("Should throw when cost code not found")
    void shouldThrowException_whenCostCodeNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(costCodeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> costCodeService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Код затрат не найден");
    }

    @Test
    @DisplayName("Should soft delete cost code")
    void shouldSoftDelete_whenValidId() {
        when(costCodeRepository.findById(costCodeId)).thenReturn(Optional.of(testCostCode));
        when(costCodeRepository.save(any(CostCode.class))).thenAnswer(inv -> inv.getArgument(0));

        costCodeService.delete(costCodeId);

        assertThat(testCostCode.isDeleted()).isTrue();
        verify(auditService).logDelete("CostCode", costCodeId);
    }
}
