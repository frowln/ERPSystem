package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.Commitment;
import com.privod.platform.modules.costManagement.domain.CommitmentItem;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.domain.CommitmentType;
import com.privod.platform.modules.costManagement.repository.CommitmentItemRepository;
import com.privod.platform.modules.costManagement.repository.CommitmentRepository;
import com.privod.platform.modules.costManagement.web.dto.ChangeCommitmentStatusRequest;
import com.privod.platform.modules.costManagement.web.dto.CommitmentItemResponse;
import com.privod.platform.modules.costManagement.web.dto.CommitmentResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentItemRequest;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCommitmentRequest;
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
class CommitmentServiceTest {

    @Mock
    private CommitmentRepository commitmentRepository;

    @Mock
    private CommitmentItemRepository commitmentItemRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CommitmentService commitmentService;

    private UUID commitmentId;
    private UUID projectId;
    private Commitment testCommitment;

    @BeforeEach
    void setUp() {
        commitmentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testCommitment = Commitment.builder()
                .projectId(projectId)
                .number("CMT-00001")
                .title("Субподряд на электромонтаж")
                .commitmentType(CommitmentType.SUBCONTRACT)
                .status(CommitmentStatus.DRAFT)
                .originalAmount(new BigDecimal("5000000.00"))
                .approvedChangeOrders(BigDecimal.ZERO)
                .invoicedAmount(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .retentionPercent(new BigDecimal("5.00"))
                .startDate(LocalDate.of(2025, 3, 1))
                .endDate(LocalDate.of(2025, 9, 30))
                .build();
        testCommitment.setId(commitmentId);
        testCommitment.setCreatedAt(Instant.now());
        testCommitment.recalculateRevisedAmount();
    }

    @Nested
    @DisplayName("Create Commitment")
    class CreateCommitmentTests {

        @Test
        @DisplayName("Should create commitment with DRAFT status and calculated revised amount")
        void shouldCreateCommitment_withDraftStatusAndRevisedAmount() {
            CreateCommitmentRequest request = new CreateCommitmentRequest(
                    projectId, "Новое обязательство", CommitmentType.PURCHASE_ORDER,
                    UUID.randomUUID(), null,
                    new BigDecimal("3000000.00"), new BigDecimal("10.00"),
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 8, 31), null);

            when(commitmentRepository.getNextNumberSequence()).thenReturn(1L);
            when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> {
                Commitment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CommitmentResponse response = commitmentService.create(request);

            assertThat(response.status()).isEqualTo(CommitmentStatus.DRAFT);
            assertThat(response.originalAmount()).isEqualByComparingTo(new BigDecimal("3000000.00"));
            assertThat(response.revisedAmount()).isEqualByComparingTo(new BigDecimal("3000000.00"));
            verify(auditService).logCreate(eq("Commitment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should fail when end date is before start date")
        void shouldThrowException_whenInvalidDates() {
            CreateCommitmentRequest request = new CreateCommitmentRequest(
                    projectId, "Обязательство", CommitmentType.SUBCONTRACT,
                    null, null, new BigDecimal("1000000.00"), null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1), null);

            assertThatThrownBy(() -> commitmentService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания должна быть позже даты начала");
        }

        @Test
        @DisplayName("Should default retention percent to ZERO when null")
        void shouldDefaultRetention_whenNull() {
            CreateCommitmentRequest request = new CreateCommitmentRequest(
                    projectId, "Обязательство", CommitmentType.PURCHASE_ORDER,
                    null, null, new BigDecimal("1000000.00"), null,
                    null, null, null);

            when(commitmentRepository.getNextNumberSequence()).thenReturn(2L);
            when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> {
                Commitment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CommitmentResponse response = commitmentService.create(request);

            assertThat(response.retentionPercent()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Commitment Lifecycle")
    class CommitmentLifecycleTests {

        @Test
        @DisplayName("Should transition from DRAFT to ISSUED")
        void shouldChangeStatus_draftToIssued() {
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));
            when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeCommitmentStatusRequest request = new ChangeCommitmentStatusRequest(CommitmentStatus.ISSUED);
            CommitmentResponse response = commitmentService.changeStatus(commitmentId, request);

            assertThat(response.status()).isEqualTo(CommitmentStatus.ISSUED);
            verify(auditService).logStatusChange("Commitment", commitmentId, "DRAFT", "ISSUED");
        }

        @Test
        @DisplayName("Should transition from ISSUED to APPROVED")
        void shouldChangeStatus_issuedToApproved() {
            testCommitment.setStatus(CommitmentStatus.ISSUED);
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));
            when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeCommitmentStatusRequest request = new ChangeCommitmentStatusRequest(CommitmentStatus.APPROVED);
            CommitmentResponse response = commitmentService.changeStatus(commitmentId, request);

            assertThat(response.status()).isEqualTo(CommitmentStatus.APPROVED);
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void shouldThrowException_whenInvalidTransition() {
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));

            ChangeCommitmentStatusRequest request = new ChangeCommitmentStatusRequest(CommitmentStatus.APPROVED);

            assertThatThrownBy(() -> commitmentService.changeStatus(commitmentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести обязательство");
        }

        @Test
        @DisplayName("Should reject update when not in DRAFT status")
        void shouldThrowException_whenUpdateNonDraft() {
            testCommitment.setStatus(CommitmentStatus.APPROVED);
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));

            UpdateCommitmentRequest request = new UpdateCommitmentRequest(
                    "Обновление", null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> commitmentService.update(commitmentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование обязательства возможно только в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("Change Orders and Items")
    class ChangeOrderAndItemTests {

        @Test
        @DisplayName("Should add change order and recalculate revised amount")
        void shouldAddChangeOrder_andRecalculate() {
            testCommitment.setStatus(CommitmentStatus.APPROVED);
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));
            when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> inv.getArgument(0));

            CommitmentResponse response = commitmentService.addChangeOrder(
                    commitmentId, new BigDecimal("500000.00"));

            assertThat(response.approvedChangeOrders()).isEqualByComparingTo(new BigDecimal("500000.00"));
            assertThat(response.revisedAmount()).isEqualByComparingTo(new BigDecimal("5500000.00"));
        }

        @Test
        @DisplayName("Should reject change order for VOID commitment")
        void shouldThrowException_whenAddingChangeOrderToVoid() {
            testCommitment.setStatus(CommitmentStatus.VOID);
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));

            assertThatThrownBy(() -> commitmentService.addChangeOrder(
                    commitmentId, new BigDecimal("100000.00")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно добавить изменение");
        }

        @Test
        @DisplayName("Should reject change order for CLOSED commitment")
        void shouldThrowException_whenAddingChangeOrderToClosed() {
            testCommitment.setStatus(CommitmentStatus.CLOSED);
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));

            assertThatThrownBy(() -> commitmentService.addChangeOrder(
                    commitmentId, new BigDecimal("100000.00")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно добавить изменение");
        }

        @Test
        @DisplayName("Should add item to commitment")
        void shouldAddItem_whenValidInput() {
            when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));
            when(commitmentItemRepository.save(any(CommitmentItem.class))).thenAnswer(inv -> {
                CommitmentItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            CreateCommitmentItemRequest request = new CreateCommitmentItemRequest(
                    "Электрокабель", UUID.randomUUID(),
                    new BigDecimal("500"), "м.п.",
                    new BigDecimal("200.00"), 1);

            CommitmentItemResponse response = commitmentService.addItem(commitmentId, request);

            assertThat(response.description()).isEqualTo("Электрокабель");
        }
    }

    @Test
    @DisplayName("Should throw when commitment not found")
    void shouldThrowException_whenCommitmentNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(commitmentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commitmentService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Обязательство не найдено");
    }

    @Test
    @DisplayName("Should soft delete commitment")
    void shouldSoftDelete_whenValidId() {
        when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(testCommitment));
        when(commitmentRepository.save(any(Commitment.class))).thenAnswer(inv -> inv.getArgument(0));

        commitmentService.delete(commitmentId);

        assertThat(testCommitment.isDeleted()).isTrue();
        verify(auditService).logDelete("Commitment", commitmentId);
    }
}
