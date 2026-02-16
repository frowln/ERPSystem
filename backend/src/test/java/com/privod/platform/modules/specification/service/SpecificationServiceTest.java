package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import com.privod.platform.modules.specification.web.dto.ChangeSpecStatusRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecificationRequest;
import com.privod.platform.modules.specification.web.dto.SpecItemResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationSummaryResponse;
import com.privod.platform.modules.specification.web.dto.UpdateSpecificationRequest;
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
import java.util.Collections;
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
class SpecificationServiceTest {

    @Mock
    private SpecificationRepository specificationRepository;

    @Mock
    private SpecItemRepository specItemRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SpecificationService specificationService;

    private UUID specId;
    private UUID projectId;
    private Specification testSpec;

    @BeforeEach
    void setUp() {
        specId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testSpec = Specification.builder()
                .name("SPEC-00001")
                .projectId(projectId)
                .docVersion(1)
                .isCurrent(true)
                .status(SpecificationStatus.DRAFT)
                .notes("Тестовая спецификация")
                .build();
        testSpec.setId(specId);
        testSpec.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Specification")
    class CreateSpecificationTests {

        @Test
        @DisplayName("Should create specification with DRAFT status")
        void shouldCreateSpecification_whenValidInput() {
            CreateSpecificationRequest request = new CreateSpecificationRequest(
                    projectId, UUID.randomUUID(), "Заметки");

            when(specificationRepository.getNextNameSequence()).thenReturn(1L);
            when(specificationRepository.save(any(Specification.class))).thenAnswer(inv -> {
                Specification s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SpecificationResponse response = specificationService.createSpecification(request);

            assertThat(response.status()).isEqualTo(SpecificationStatus.DRAFT);
            assertThat(response.name()).isEqualTo("SPEC-00001");
            assertThat(response.docVersion()).isEqualTo(1);
            verify(auditService).logCreate(eq("Specification"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Specification")
    class GetSpecificationTests {

        @Test
        @DisplayName("Should find specification by ID")
        void shouldReturnSpecification_whenExists() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId))
                    .thenReturn(Collections.emptyList());

            SpecificationResponse response = specificationService.getSpecification(specId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("SPEC-00001");
        }

        @Test
        @DisplayName("Should throw when specification not found")
        void shouldThrowException_whenSpecificationNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(specificationRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> specificationService.getSpecification(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Спецификация не найдена");
        }
    }

    @Nested
    @DisplayName("Update Specification")
    class UpdateSpecificationTests {

        @Test
        @DisplayName("Should update specification fields")
        void shouldUpdateSpecification_whenValidInput() {
            UUID newContractId = UUID.randomUUID();
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specificationRepository.save(any(Specification.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateSpecificationRequest request = new UpdateSpecificationRequest(newContractId, "Новые заметки");

            SpecificationResponse response = specificationService.updateSpecification(specId, request);

            assertThat(testSpec.getContractId()).isEqualTo(newContractId);
            assertThat(testSpec.getNotes()).isEqualTo("Новые заметки");
            verify(auditService).logUpdate("Specification", specId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));

            ChangeSpecStatusRequest request = new ChangeSpecStatusRequest(SpecificationStatus.APPROVED);

            assertThatThrownBy(() -> specificationService.changeStatus(specId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести спецификацию");
        }

        @Test
        @DisplayName("Should submit for review from DRAFT")
        void shouldSubmitForReview_whenDraft() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specificationRepository.save(any(Specification.class))).thenAnswer(inv -> inv.getArgument(0));

            SpecificationResponse response = specificationService.submitForReview(specId);

            assertThat(response.status()).isEqualTo(SpecificationStatus.IN_REVIEW);
            verify(auditService).logStatusChange("Specification", specId, "DRAFT", "IN_REVIEW");
        }

        @Test
        @DisplayName("Should reject submit for review when not DRAFT")
        void shouldThrowException_whenSubmitNonDraft() {
            testSpec.setStatus(SpecificationStatus.APPROVED);
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));

            assertThatThrownBy(() -> specificationService.submitForReview(specId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не может быть отправлена на проверку");
        }
    }

    @Nested
    @DisplayName("Spec Item Management")
    class SpecItemTests {

        @Test
        @DisplayName("Should add item to specification")
        void shouldAddItem_whenValidInput() {
            CreateSpecItemRequest request = new CreateSpecItemRequest(
                    null, SpecItemType.MATERIAL, "Арматура А500", "ART-001",
                    new BigDecimal("1000"), "кг", new BigDecimal("50000"),
                    null, false);

            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specItemRepository.countBySpecificationIdAndDeletedFalse(specId)).thenReturn(0L);
            when(specItemRepository.save(any(SpecItem.class))).thenAnswer(inv -> {
                SpecItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            SpecItemResponse response = specificationService.addItem(specId, request);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Арматура А500");
            verify(auditService).logCreate(eq("SpecItem"), any(UUID.class));
        }

        @Test
        @DisplayName("Should remove spec item via soft delete")
        void shouldRemoveItem_whenExists() {
            UUID itemId = UUID.randomUUID();
            SpecItem item = SpecItem.builder()
                    .specificationId(specId)
                    .name("Тестовая позиция")
                    .itemType(SpecItemType.MATERIAL)
                    .build();
            item.setId(itemId);
            item.setCreatedAt(Instant.now());

            when(specItemRepository.findById(itemId)).thenReturn(Optional.of(item));
            when(specItemRepository.save(any(SpecItem.class))).thenAnswer(inv -> inv.getArgument(0));

            specificationService.removeItem(itemId);

            assertThat(item.isDeleted()).isTrue();
            verify(auditService).logDelete("SpecItem", itemId);
        }
    }

    @Nested
    @DisplayName("Items Summary")
    class ItemsSummaryTests {

        @Test
        @DisplayName("Should calculate summary by item types")
        void shouldCalculateSummary_whenItemsExist() {
            SpecItem material = SpecItem.builder()
                    .specificationId(specId).itemType(SpecItemType.MATERIAL)
                    .name("Mat").plannedAmount(new BigDecimal("100000")).build();
            SpecItem equipment = SpecItem.builder()
                    .specificationId(specId).itemType(SpecItemType.EQUIPMENT)
                    .name("Equip").plannedAmount(new BigDecimal("200000")).build();
            SpecItem work = SpecItem.builder()
                    .specificationId(specId).itemType(SpecItemType.WORK)
                    .name("Work").plannedAmount(new BigDecimal("300000")).build();

            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId))
                    .thenReturn(List.of(material, equipment, work));

            SpecificationSummaryResponse summary = specificationService.getItemsSummary(specId);

            assertThat(summary.totalItems()).isEqualTo(3);
            assertThat(summary.materialCount()).isEqualTo(1);
            assertThat(summary.equipmentCount()).isEqualTo(1);
            assertThat(summary.workCount()).isEqualTo(1);
            assertThat(summary.totalPlanned()).isEqualByComparingTo(new BigDecimal("600000"));
        }
    }
}
