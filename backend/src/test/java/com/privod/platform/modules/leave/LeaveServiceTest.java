package com.privod.platform.modules.leave;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.leave.domain.LeaveAllocation;
import com.privod.platform.modules.leave.domain.LeaveAllocationStatus;
import com.privod.platform.modules.leave.domain.LeaveRequest;
import com.privod.platform.modules.leave.domain.LeaveRequestStatus;
import com.privod.platform.modules.leave.domain.LeaveType;
import com.privod.platform.modules.leave.repository.LeaveAllocationRepository;
import com.privod.platform.modules.leave.repository.LeaveRequestRepository;
import com.privod.platform.modules.leave.repository.LeaveTypeRepository;
import com.privod.platform.modules.leave.service.LeaveService;
import com.privod.platform.modules.leave.web.dto.CreateLeaveAllocationRequest;
import com.privod.platform.modules.leave.web.dto.CreateLeaveRequestRequest;
import com.privod.platform.modules.leave.web.dto.LeaveAllocationResponse;
import com.privod.platform.modules.leave.web.dto.LeaveRequestResponse;
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
class LeaveServiceTest {

    @Mock
    private LeaveTypeRepository leaveTypeRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private LeaveAllocationRepository leaveAllocationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private LeaveService leaveService;

    private UUID leaveTypeId;
    private UUID employeeId;
    private UUID leaveRequestId;
    private UUID allocationId;
    private LeaveType testLeaveType;
    private LeaveRequest testLeaveRequest;
    private LeaveAllocation testAllocation;

    @BeforeEach
    void setUp() {
        leaveTypeId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        leaveRequestId = UUID.randomUUID();
        allocationId = UUID.randomUUID();

        testLeaveType = LeaveType.builder()
                .name("Ежегодный отпуск")
                .code("ANNUAL")
                .color("#4CAF50")
                .maxDays(new BigDecimal("28.0"))
                .requiresApproval(true)
                .allowNegative(false)
                .isActive(true)
                .build();
        testLeaveType.setId(leaveTypeId);
        testLeaveType.setCreatedAt(Instant.now());

        testLeaveRequest = LeaveRequest.builder()
                .employeeId(employeeId)
                .leaveTypeId(leaveTypeId)
                .startDate(LocalDate.of(2025, 7, 1))
                .endDate(LocalDate.of(2025, 7, 14))
                .numberOfDays(new BigDecimal("10.0"))
                .reason("Ежегодный отпуск")
                .status(LeaveRequestStatus.DRAFT)
                .build();
        testLeaveRequest.setId(leaveRequestId);
        testLeaveRequest.setCreatedAt(Instant.now());

        testAllocation = LeaveAllocation.builder()
                .employeeId(employeeId)
                .leaveTypeId(leaveTypeId)
                .allocatedDays(new BigDecimal("28.0"))
                .usedDays(BigDecimal.ZERO)
                .remainingDays(new BigDecimal("28.0"))
                .year(LocalDate.now().getYear())
                .notes("Ежегодный отпуск на текущий год")
                .status(LeaveAllocationStatus.APPROVED)
                .build();
        testAllocation.setId(allocationId);
        testAllocation.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Leave Request")
    class CreateLeaveRequestTests {

        @Test
        @DisplayName("Should create leave request with DRAFT status when no overlap")
        void createLeaveRequest_NoOverlap_CreatesDraft() {
            CreateLeaveRequestRequest request = new CreateLeaveRequestRequest(
                    employeeId, leaveTypeId,
                    LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 10),
                    new BigDecimal("8.0"), "Летний отпуск");

            when(leaveTypeRepository.findById(leaveTypeId)).thenReturn(Optional.of(testLeaveType));
            when(leaveRequestRepository.findOverlapping(employeeId,
                    LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 10)))
                    .thenReturn(Collections.emptyList());
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(invocation -> {
                LeaveRequest lr = invocation.getArgument(0);
                lr.setId(UUID.randomUUID());
                lr.setCreatedAt(Instant.now());
                return lr;
            });

            LeaveRequestResponse response = leaveService.createLeaveRequest(request);

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.DRAFT);
            assertThat(response.numberOfDays()).isEqualByComparingTo(new BigDecimal("8.0"));
            assertThat(response.employeeId()).isEqualTo(employeeId);
            verify(auditService).logCreate(eq("LeaveRequest"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when overlapping leave request exists")
        void createLeaveRequest_Overlapping_ThrowsException() {
            CreateLeaveRequestRequest request = new CreateLeaveRequestRequest(
                    employeeId, leaveTypeId,
                    LocalDate.of(2025, 7, 5), LocalDate.of(2025, 7, 20),
                    new BigDecimal("12.0"), "Пересекающийся отпуск");

            when(leaveTypeRepository.findById(leaveTypeId)).thenReturn(Optional.of(testLeaveType));
            when(leaveRequestRepository.findOverlapping(employeeId,
                    LocalDate.of(2025, 7, 5), LocalDate.of(2025, 7, 20)))
                    .thenReturn(List.of(testLeaveRequest));

            assertThatThrownBy(() -> leaveService.createLeaveRequest(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Пересечение с существующим запросом на отпуск");
        }

        @Test
        @DisplayName("Should throw when leave type does not exist")
        void createLeaveRequest_LeaveTypeNotFound_ThrowsException() {
            UUID missingTypeId = UUID.randomUUID();
            CreateLeaveRequestRequest request = new CreateLeaveRequestRequest(
                    employeeId, missingTypeId,
                    LocalDate.of(2025, 9, 1), LocalDate.of(2025, 9, 5),
                    new BigDecimal("5.0"), null);

            when(leaveTypeRepository.findById(missingTypeId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> leaveService.createLeaveRequest(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Тип отпуска не найден");
        }
    }

    @Nested
    @DisplayName("Submit Leave Request")
    class SubmitLeaveRequestTests {

        @Test
        @DisplayName("Should submit DRAFT request and change status to SUBMITTED")
        void submitLeaveRequest_DraftStatus_ChangesToSubmitted() {
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            LeaveRequestResponse response = leaveService.submitLeaveRequest(leaveRequestId);

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.SUBMITTED);
            verify(auditService).logUpdate("LeaveRequest", leaveRequestId, "status", "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should throw when submitting non-DRAFT request")
        void submitLeaveRequest_NonDraft_ThrowsException() {
            testLeaveRequest.setStatus(LeaveRequestStatus.SUBMITTED);
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));

            assertThatThrownBy(() -> leaveService.submitLeaveRequest(leaveRequestId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Только черновики могут быть отправлены на рассмотрение");
        }
    }

    @Nested
    @DisplayName("Approve Leave Request")
    class ApproveLeaveRequestTests {

        @Test
        @DisplayName("Should approve SUBMITTED request and update allocation used days")
        void approveLeaveRequest_SufficientBalance_ApprovesAndUpdatesAllocation() {
            testLeaveRequest.setStatus(LeaveRequestStatus.SUBMITTED);
            UUID approverId = UUID.randomUUID();

            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(leaveTypeRepository.findById(leaveTypeId)).thenReturn(Optional.of(testLeaveType));
            when(leaveAllocationRepository.findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
                    eq(employeeId), eq(leaveTypeId), any(Integer.class)))
                    .thenReturn(Optional.of(testAllocation));

            LeaveRequestResponse response = leaveService.approveLeaveRequest(leaveRequestId, approverId);

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.APPROVED);
            assertThat(response.approverId()).isEqualTo(approverId);
            assertThat(response.approvedAt()).isNotNull();
            assertThat(testAllocation.getUsedDays()).isEqualByComparingTo(new BigDecimal("10.0"));
            verify(auditService).logUpdate("LeaveRequest", leaveRequestId, "status", "SUBMITTED", "APPROVED");
        }

        @Test
        @DisplayName("Should throw when approving non-SUBMITTED request")
        void approveLeaveRequest_NonSubmitted_ThrowsException() {
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));

            assertThatThrownBy(() -> leaveService.approveLeaveRequest(leaveRequestId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Только поданные запросы могут быть утверждены");
        }

        @Test
        @DisplayName("Should throw when leave balance is insufficient")
        void approveLeaveRequest_InsufficientBalance_ThrowsException() {
            testLeaveRequest.setStatus(LeaveRequestStatus.SUBMITTED);
            testAllocation.setRemainingDays(new BigDecimal("5.0"));

            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveTypeRepository.findById(leaveTypeId)).thenReturn(Optional.of(testLeaveType));
            when(leaveAllocationRepository.findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
                    eq(employeeId), eq(leaveTypeId), any(Integer.class)))
                    .thenReturn(Optional.of(testAllocation));

            assertThatThrownBy(() -> leaveService.approveLeaveRequest(leaveRequestId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Недостаточно дней отпуска");
        }
    }

    @Nested
    @DisplayName("Refuse Leave Request")
    class RefuseLeaveRequestTests {

        @Test
        @DisplayName("Should refuse SUBMITTED request with reason")
        void refuseLeaveRequest_Submitted_SetsRefusedStatus() {
            testLeaveRequest.setStatus(LeaveRequestStatus.SUBMITTED);
            UUID approverId = UUID.randomUUID();

            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            LeaveRequestResponse response = leaveService.refuseLeaveRequest(
                    leaveRequestId, approverId, "Производственная необходимость");

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.REFUSED);
            assertThat(response.refusalReason()).isEqualTo("Производственная необходимость");
            assertThat(response.approverId()).isEqualTo(approverId);
            verify(auditService).logUpdate("LeaveRequest", leaveRequestId, "status", "SUBMITTED", "REFUSED");
        }

        @Test
        @DisplayName("Should throw when refusing non-SUBMITTED request")
        void refuseLeaveRequest_Draft_ThrowsException() {
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));

            assertThatThrownBy(() -> leaveService.refuseLeaveRequest(
                    leaveRequestId, UUID.randomUUID(), "Причина"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Только поданные запросы могут быть отклонены");
        }
    }

    @Nested
    @DisplayName("Cancel Leave Request")
    class CancelLeaveRequestTests {

        @Test
        @DisplayName("Should cancel DRAFT request without reversing allocation")
        void cancelLeaveRequest_DraftStatus_CancelsWithoutReversal() {
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            LeaveRequestResponse response = leaveService.cancelLeaveRequest(leaveRequestId);

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.CANCELLED);
            verify(auditService).logUpdate("LeaveRequest", leaveRequestId, "status", "DRAFT", "CANCELLED");
        }

        @Test
        @DisplayName("Should cancel APPROVED request and reverse allocation used days")
        void cancelLeaveRequest_ApprovedStatus_ReversesAllocation() {
            testLeaveRequest.setStatus(LeaveRequestStatus.APPROVED);
            testAllocation.setUsedDays(new BigDecimal("10.0"));
            testAllocation.setRemainingDays(new BigDecimal("18.0"));

            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(leaveAllocationRepository.findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
                    eq(employeeId), eq(leaveTypeId), eq(2025)))
                    .thenReturn(Optional.of(testAllocation));

            LeaveRequestResponse response = leaveService.cancelLeaveRequest(leaveRequestId);

            assertThat(response.status()).isEqualTo(LeaveRequestStatus.CANCELLED);
            assertThat(testAllocation.getUsedDays()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(testAllocation.getRemainingDays()).isEqualByComparingTo(new BigDecimal("28.0"));
        }

        @Test
        @DisplayName("Should throw when cancelling already-cancelled request")
        void cancelLeaveRequest_AlreadyCancelled_ThrowsException() {
            testLeaveRequest.setStatus(LeaveRequestStatus.CANCELLED);
            when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest));

            assertThatThrownBy(() -> leaveService.cancelLeaveRequest(leaveRequestId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Запрос уже отменён");
        }
    }

    @Nested
    @DisplayName("Create Allocation")
    class CreateAllocationTests {

        @Test
        @DisplayName("Should create allocation with DRAFT status and zero used/remaining days")
        void createAllocation_ValidRequest_CreatesDraft() {
            CreateLeaveAllocationRequest request = new CreateLeaveAllocationRequest(
                    employeeId, leaveTypeId, new BigDecimal("28.0"), 2025, "Ежегодный");

            when(leaveTypeRepository.findById(leaveTypeId)).thenReturn(Optional.of(testLeaveType));
            when(leaveAllocationRepository.save(any(LeaveAllocation.class))).thenAnswer(invocation -> {
                LeaveAllocation la = invocation.getArgument(0);
                la.setId(UUID.randomUUID());
                la.setCreatedAt(Instant.now());
                return la;
            });

            LeaveAllocationResponse response = leaveService.createAllocation(request);

            assertThat(response.status()).isEqualTo(LeaveAllocationStatus.DRAFT);
            assertThat(response.allocatedDays()).isEqualByComparingTo(new BigDecimal("28.0"));
            assertThat(response.usedDays()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.remainingDays()).isEqualByComparingTo(new BigDecimal("28.0"));
            assertThat(response.year()).isEqualTo(2025);
            verify(auditService).logCreate(eq("LeaveAllocation"), any(UUID.class));
        }
    }
}
