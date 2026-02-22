package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Timesheet;
import com.privod.platform.modules.hr.domain.TimesheetStatus;
import com.privod.platform.modules.hr.repository.TimesheetRepository;
import com.privod.platform.modules.hr.web.dto.CreateTimesheetRequest;
import com.privod.platform.modules.hr.web.dto.TimesheetResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetSummaryResponse;
import com.privod.platform.modules.hr.web.dto.UpdateTimesheetRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
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
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimesheetServiceTest {

    @Mock private TimesheetRepository timesheetRepository;
    @Mock private AuditService auditService;

    @InjectMocks private TimesheetService timesheetService;

    private MockedStatic<SecurityUtils> securityUtilsMock;
    private UUID organizationId;
    private UUID employeeId;
    private UUID projectId;
    private UUID timesheetId;
    private Timesheet testTimesheet;

    @BeforeEach
    void setUp() {
        organizationId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        timesheetId = UUID.randomUUID();

        securityUtilsMock = mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::requireCurrentOrganizationId).thenReturn(organizationId);

        testTimesheet = Timesheet.builder()
                .employeeId(employeeId)
                .projectId(projectId)
                .workDate(LocalDate.of(2026, 2, 10))
                .hoursWorked(new BigDecimal("8.00"))
                .overtimeHours(BigDecimal.ZERO)
                .status(TimesheetStatus.DRAFT)
                .organizationId(organizationId)
                .build();
        testTimesheet.setId(timesheetId);
        testTimesheet.setCreatedAt(Instant.now());
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    private void mockGetTimesheet() {
        when(timesheetRepository.findById(timesheetId)).thenReturn(Optional.of(testTimesheet));
    }

    @Nested
    @DisplayName("Create Timesheet")
    class CreateTests {

        @Test
        @DisplayName("Should create timesheet with DRAFT status")
        void shouldCreate_withDraftStatus() {
            CreateTimesheetRequest request = new CreateTimesheetRequest(
                    employeeId, projectId, LocalDate.of(2026, 2, 10),
                    new BigDecimal("8.00"), null, "work notes");

            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> {
                Timesheet ts = inv.getArgument(0);
                ts.setId(UUID.randomUUID());
                ts.setCreatedAt(Instant.now());
                return ts;
            });

            TimesheetResponse response = timesheetService.createTimesheet(request);

            assertThat(response.status()).isEqualTo(TimesheetStatus.DRAFT);
            assertThat(response.hoursWorked()).isEqualByComparingTo(new BigDecimal("8.00"));
            assertThat(response.overtimeHours()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("Timesheet"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default overtime to ZERO when null")
        void shouldDefaultOvertime_whenNull() {
            CreateTimesheetRequest request = new CreateTimesheetRequest(
                    employeeId, projectId, LocalDate.now(),
                    new BigDecimal("10.00"), null, null);

            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> {
                Timesheet ts = inv.getArgument(0);
                ts.setId(UUID.randomUUID());
                ts.setCreatedAt(Instant.now());
                return ts;
            });

            TimesheetResponse response = timesheetService.createTimesheet(request);

            assertThat(response.overtimeHours()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Update Timesheet")
    class UpdateTests {

        @Test
        @DisplayName("Should update timesheet in DRAFT status")
        void shouldUpdate_whenDraft() {
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateTimesheetRequest request = new UpdateTimesheetRequest(
                    new BigDecimal("10.00"), new BigDecimal("2.00"), "updated notes");

            TimesheetResponse response = timesheetService.updateTimesheet(timesheetId, request);

            assertThat(response.hoursWorked()).isEqualByComparingTo(new BigDecimal("10.00"));
            assertThat(response.overtimeHours()).isEqualByComparingTo(new BigDecimal("2.00"));
            verify(auditService).logUpdate(eq("Timesheet"), eq(timesheetId), any(), any(), any());
        }

        @Test
        @DisplayName("Should update timesheet in REJECTED status")
        void shouldUpdate_whenRejected() {
            testTimesheet.setStatus(TimesheetStatus.REJECTED);
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateTimesheetRequest request = new UpdateTimesheetRequest(
                    new BigDecimal("9.00"), null, null);

            TimesheetResponse response = timesheetService.updateTimesheet(timesheetId, request);

            assertThat(response.hoursWorked()).isEqualByComparingTo(new BigDecimal("9.00"));
        }

        @Test
        @DisplayName("Should reject update when SUBMITTED")
        void shouldReject_whenSubmitted() {
            testTimesheet.setStatus(TimesheetStatus.SUBMITTED);
            mockGetTimesheet();

            UpdateTimesheetRequest request = new UpdateTimesheetRequest(
                    new BigDecimal("10.00"), null, null);

            assertThatThrownBy(() -> timesheetService.updateTimesheet(timesheetId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }

        @Test
        @DisplayName("Should reject update when APPROVED")
        void shouldReject_whenApproved() {
            testTimesheet.setStatus(TimesheetStatus.APPROVED);
            mockGetTimesheet();

            UpdateTimesheetRequest request = new UpdateTimesheetRequest(null, null, "notes");

            assertThatThrownBy(() -> timesheetService.updateTimesheet(timesheetId, request))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Timesheet Status Transitions")
    class StatusTests {

        @Test
        @DisplayName("Should submit timesheet from DRAFT")
        void shouldSubmit_fromDraft() {
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            TimesheetResponse response = timesheetService.submitTimesheet(timesheetId);

            assertThat(response.status()).isEqualTo(TimesheetStatus.SUBMITTED);
            verify(auditService).logStatusChange("Timesheet", timesheetId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should submit timesheet from REJECTED")
        void shouldSubmit_fromRejected() {
            testTimesheet.setStatus(TimesheetStatus.REJECTED);
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            TimesheetResponse response = timesheetService.submitTimesheet(timesheetId);

            assertThat(response.status()).isEqualTo(TimesheetStatus.SUBMITTED);
        }

        @Test
        @DisplayName("Should reject submit from APPROVED")
        void shouldRejectSubmit_fromApproved() {
            testTimesheet.setStatus(TimesheetStatus.APPROVED);
            mockGetTimesheet();

            assertThatThrownBy(() -> timesheetService.submitTimesheet(timesheetId))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("Should approve timesheet from SUBMITTED")
        void shouldApprove_fromSubmitted() {
            testTimesheet.setStatus(TimesheetStatus.SUBMITTED);
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID approverId = UUID.randomUUID();
            TimesheetResponse response = timesheetService.approveTimesheet(timesheetId, approverId);

            assertThat(response.status()).isEqualTo(TimesheetStatus.APPROVED);
            assertThat(response.approvedById()).isEqualTo(approverId);
            verify(auditService).logStatusChange("Timesheet", timesheetId, "SUBMITTED", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approve from DRAFT")
        void shouldRejectApprove_fromDraft() {
            mockGetTimesheet();

            assertThatThrownBy(() -> timesheetService.approveTimesheet(timesheetId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("Should reject timesheet from SUBMITTED")
        void shouldReject_fromSubmitted() {
            testTimesheet.setStatus(TimesheetStatus.SUBMITTED);
            mockGetTimesheet();
            when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

            TimesheetResponse response = timesheetService.rejectTimesheet(timesheetId);

            assertThat(response.status()).isEqualTo(TimesheetStatus.REJECTED);
            verify(auditService).logStatusChange("Timesheet", timesheetId, "SUBMITTED", "REJECTED");
        }

        @Test
        @DisplayName("Should reject reject from DRAFT")
        void shouldRejectReject_fromDraft() {
            mockGetTimesheet();

            assertThatThrownBy(() -> timesheetService.rejectTimesheet(timesheetId))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    @DisplayName("Should throw when timesheet not found")
    void shouldThrow_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(timesheetRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> timesheetService.getTimesheet(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Табель не найден");
    }

    @Test
    @DisplayName("Should return weekly summary")
    void shouldReturnWeeklySummary() {
        LocalDate weekStart = LocalDate.of(2026, 2, 9);
        LocalDate weekEnd = weekStart.plusDays(6);

        Timesheet ts1 = Timesheet.builder()
                .employeeId(employeeId).projectId(projectId)
                .workDate(weekStart).hoursWorked(new BigDecimal("8")).overtimeHours(new BigDecimal("1"))
                .status(TimesheetStatus.APPROVED).organizationId(organizationId).build();
        ts1.setId(UUID.randomUUID());
        ts1.setCreatedAt(Instant.now());

        Timesheet ts2 = Timesheet.builder()
                .employeeId(employeeId).projectId(projectId)
                .workDate(weekStart.plusDays(1)).hoursWorked(new BigDecimal("7")).overtimeHours(BigDecimal.ZERO)
                .status(TimesheetStatus.DRAFT).organizationId(organizationId).build();
        ts2.setId(UUID.randomUUID());
        ts2.setCreatedAt(Instant.now());

        when(timesheetRepository.findByEmployeeIdAndWorkDateBetweenAndDeletedFalse(employeeId, weekStart, weekEnd))
                .thenReturn(List.of(ts1, ts2));

        TimesheetSummaryResponse summary = timesheetService.getWeeklySummary(employeeId, weekStart);

        assertThat(summary.totalHours()).isEqualByComparingTo(new BigDecimal("15"));
        assertThat(summary.totalOvertimeHours()).isEqualByComparingTo(new BigDecimal("1"));
        assertThat(summary.entryCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should soft-delete timesheet")
    void shouldSoftDelete() {
        mockGetTimesheet();
        when(timesheetRepository.save(any(Timesheet.class))).thenAnswer(inv -> inv.getArgument(0));

        timesheetService.deleteTimesheet(timesheetId);

        assertThat(testTimesheet.isDeleted()).isTrue();
        verify(auditService).logDelete("Timesheet", timesheetId);
    }
}
