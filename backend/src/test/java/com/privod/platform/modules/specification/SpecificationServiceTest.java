package com.privod.platform.modules.specification;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import com.privod.platform.modules.specification.service.SpecificationService;
import com.privod.platform.modules.specification.web.dto.ChangeSpecStatusRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecificationRequest;
import com.privod.platform.modules.specification.web.dto.SpecItemResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationSummaryResponse;
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
                .build();
        testSpec.setId(specId);
        testSpec.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Specification")
    class CreateSpecificationTests {

        @Test
        @DisplayName("Should create specification with DRAFT status and auto-generated name")
        void createSpecification_Success() {
            CreateSpecificationRequest request = new CreateSpecificationRequest(projectId, null, "Test notes");

            when(specificationRepository.getNextNameSequence()).thenReturn(1L);
            when(specificationRepository.save(any(Specification.class))).thenAnswer(invocation -> {
                Specification s = invocation.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SpecificationResponse response = specificationService.createSpecification(request);

            assertThat(response.status()).isEqualTo(SpecificationStatus.DRAFT);
            assertThat(response.name()).isEqualTo("SPEC-00001");
            assertThat(response.projectId()).isEqualTo(projectId);
            assertThat(response.isCurrent()).isTrue();
            verify(auditService).logCreate(eq("Specification"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Add Item")
    class AddItemTests {

        @Test
        @DisplayName("Should add item to specification")
        void addItem_Success() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specItemRepository.countBySpecificationIdAndDeletedFalse(specId)).thenReturn(0L);
            when(specItemRepository.save(any(SpecItem.class))).thenAnswer(invocation -> {
                SpecItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            CreateSpecItemRequest request = new CreateSpecItemRequest(
                    SpecItemType.MATERIAL, "Бетон М300", "MAT-001",
                    new BigDecimal("100.000"), "м3",
                    new BigDecimal("500000.00"), "Для фундамента", null, false);

            SpecItemResponse response = specificationService.addItem(specId, request);

            assertThat(response.name()).isEqualTo("Бетон М300");
            assertThat(response.itemType()).isEqualTo(SpecItemType.MATERIAL);
            assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("100.000"));
            assertThat(response.unitOfMeasure()).isEqualTo("м3");
            verify(auditService).logCreate(eq("SpecItem"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should allow valid status transition DRAFT -> IN_REVIEW")
        void changeStatus_ValidTransition() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specificationRepository.save(any(Specification.class))).thenReturn(testSpec);

            ChangeSpecStatusRequest request = new ChangeSpecStatusRequest(SpecificationStatus.IN_REVIEW);
            SpecificationResponse response = specificationService.changeStatus(specId, request);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("Specification", specId, "DRAFT", "IN_REVIEW");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> APPROVED")
        void changeStatus_InvalidTransition() {
            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));

            ChangeSpecStatusRequest request = new ChangeSpecStatusRequest(SpecificationStatus.APPROVED);

            assertThatThrownBy(() -> specificationService.changeStatus(specId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести");
        }

        @Test
        @DisplayName("Should throw when specification not found")
        void changeStatus_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(specificationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            ChangeSpecStatusRequest request = new ChangeSpecStatusRequest(SpecificationStatus.IN_REVIEW);

            assertThatThrownBy(() -> specificationService.changeStatus(nonExistentId, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Create Version")
    class CreateVersionTests {

        @Test
        @DisplayName("Should create new version copying items")
        void createVersion_Success() {
            SpecItem existingItem = SpecItem.builder()
                    .specificationId(specId)
                    .sequence(1)
                    .itemType(SpecItemType.MATERIAL)
                    .name("Бетон М300")
                    .productCode("MAT-001")
                    .quantity(new BigDecimal("100.000"))
                    .unitOfMeasure("м3")
                    .plannedAmount(new BigDecimal("500000.00"))
                    .build();
            existingItem.setId(UUID.randomUUID());

            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specificationRepository.getNextNameSequence()).thenReturn(2L);
            when(specificationRepository.save(any(Specification.class))).thenAnswer(invocation -> {
                Specification s = invocation.getArgument(0);
                if (s.getId() == null) {
                    s.setId(UUID.randomUUID());
                    s.setCreatedAt(Instant.now());
                }
                return s;
            });
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId))
                    .thenReturn(List.of(existingItem));
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(any(UUID.class)))
                    .thenAnswer(invocation -> {
                        UUID id = invocation.getArgument(0);
                        if (id.equals(specId)) return List.of(existingItem);
                        return List.of();
                    });
            when(specItemRepository.save(any(SpecItem.class))).thenAnswer(invocation -> {
                SpecItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            SpecificationResponse response = specificationService.createVersion(specId);

            assertThat(response.name()).isEqualTo("SPEC-00002");
            assertThat(response.docVersion()).isEqualTo(2);
            assertThat(response.isCurrent()).isTrue();
            assertThat(response.parentVersionId()).isEqualTo(specId);
            assertThat(response.status()).isEqualTo(SpecificationStatus.DRAFT);
        }
    }

    @Nested
    @DisplayName("Get Items Summary")
    class GetItemsSummaryTests {

        @Test
        @DisplayName("Should return correct totals by item type")
        void getItemsSummary_Success() {
            SpecItem material1 = SpecItem.builder()
                    .specificationId(specId)
                    .itemType(SpecItemType.MATERIAL)
                    .name("Бетон М300")
                    .quantity(new BigDecimal("100"))
                    .unitOfMeasure("м3")
                    .plannedAmount(new BigDecimal("500000.00"))
                    .build();

            SpecItem material2 = SpecItem.builder()
                    .specificationId(specId)
                    .itemType(SpecItemType.MATERIAL)
                    .name("Арматура")
                    .quantity(new BigDecimal("10"))
                    .unitOfMeasure("т")
                    .plannedAmount(new BigDecimal("300000.00"))
                    .build();

            SpecItem equipment = SpecItem.builder()
                    .specificationId(specId)
                    .itemType(SpecItemType.EQUIPMENT)
                    .name("Кран")
                    .quantity(new BigDecimal("1"))
                    .unitOfMeasure("шт")
                    .plannedAmount(new BigDecimal("1000000.00"))
                    .build();

            SpecItem work = SpecItem.builder()
                    .specificationId(specId)
                    .itemType(SpecItemType.WORK)
                    .name("Бетонирование")
                    .quantity(new BigDecimal("100"))
                    .unitOfMeasure("м3")
                    .plannedAmount(new BigDecimal("200000.00"))
                    .build();

            when(specificationRepository.findById(specId)).thenReturn(Optional.of(testSpec));
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId))
                    .thenReturn(List.of(material1, material2, equipment, work));

            SpecificationSummaryResponse summary = specificationService.getItemsSummary(specId);

            assertThat(summary.totalItems()).isEqualTo(4);
            assertThat(summary.materialCount()).isEqualTo(2);
            assertThat(summary.equipmentCount()).isEqualTo(1);
            assertThat(summary.workCount()).isEqualTo(1);
            assertThat(summary.materialPlannedAmount()).isEqualByComparingTo(new BigDecimal("800000.00"));
            assertThat(summary.equipmentPlannedAmount()).isEqualByComparingTo(new BigDecimal("1000000.00"));
            assertThat(summary.workPlannedAmount()).isEqualByComparingTo(new BigDecimal("200000.00"));
            assertThat(summary.totalPlannedAmount()).isEqualByComparingTo(new BigDecimal("2000000.00"));
        }
    }
}
