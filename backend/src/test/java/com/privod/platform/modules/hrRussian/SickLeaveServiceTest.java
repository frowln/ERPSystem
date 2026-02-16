package com.privod.platform.modules.hrRussian;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.SickLeave;
import com.privod.platform.modules.hrRussian.domain.SickLeaveStatus;
import com.privod.platform.modules.hrRussian.repository.SickLeaveRepository;
import com.privod.platform.modules.hrRussian.service.SickLeaveService;
import com.privod.platform.modules.hrRussian.web.dto.CreateSickLeaveRequest;
import com.privod.platform.modules.hrRussian.web.dto.SickLeaveResponse;
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
class SickLeaveServiceTest {

    @Mock
    private SickLeaveRepository sickLeaveRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SickLeaveService sickLeaveService;

    private UUID sickLeaveId;
    private UUID employeeId;
    private SickLeave testSickLeave;

    @BeforeEach
    void setUp() {
        sickLeaveId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        testSickLeave = SickLeave.builder()
                .employeeId(employeeId)
                .startDate(LocalDate.of(2025, 3, 10))
                .endDate(LocalDate.of(2025, 3, 20))
                .sickLeaveNumber("БЛ-123456")
                .diagnosis("ОРВИ")
                .extension(false)
                .paymentAmount(new BigDecimal("15000.00"))
                .status(SickLeaveStatus.OPEN)
                .build();
        testSickLeave.setId(sickLeaveId);
        testSickLeave.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Sick Leave")
    class CreateSickLeaveTests {

        @Test
        @DisplayName("Should create sick leave with OPEN status")
        void createSickLeave_SetsOpenStatus() {
            CreateSickLeaveRequest request = new CreateSickLeaveRequest(
                    employeeId,
                    LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 20),
                    "БЛ-654321", "Грипп", false, null,
                    new BigDecimal("12000.00"));

            when(sickLeaveRepository.save(any(SickLeave.class))).thenAnswer(inv -> {
                SickLeave s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SickLeaveResponse response = sickLeaveService.createSickLeave(request);

            assertThat(response.status()).isEqualTo(SickLeaveStatus.OPEN);
            assertThat(response.statusDisplayName()).isEqualTo("Открыт");
            assertThat(response.sickLeaveNumber()).isEqualTo("БЛ-654321");
            assertThat(response.daysCount()).isEqualTo(11);
            verify(auditService).logCreate(eq("SickLeave"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create sick leave extension referencing previous one")
        void createSickLeave_Extension_ReferencesPrevious() {
            UUID previousId = UUID.randomUUID();
            CreateSickLeaveRequest request = new CreateSickLeaveRequest(
                    employeeId,
                    LocalDate.of(2025, 3, 21), LocalDate.of(2025, 3, 31),
                    "БЛ-654322", "ОРВИ (продление)", true, previousId,
                    new BigDecimal("10000.00"));

            when(sickLeaveRepository.save(any(SickLeave.class))).thenAnswer(inv -> {
                SickLeave s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SickLeaveResponse response = sickLeaveService.createSickLeave(request);

            assertThat(response.extension()).isTrue();
            assertThat(response.previousSickLeaveId()).isEqualTo(previousId);
        }
    }

    @Nested
    @DisplayName("Close Sick Leave")
    class CloseSickLeaveTests {

        @Test
        @DisplayName("Should close open sick leave")
        void closeSickLeave_OpenSickLeave_Success() {
            when(sickLeaveRepository.findById(sickLeaveId)).thenReturn(Optional.of(testSickLeave));
            when(sickLeaveRepository.save(any(SickLeave.class))).thenAnswer(inv -> inv.getArgument(0));

            SickLeaveResponse response = sickLeaveService.closeSickLeave(sickLeaveId);

            assertThat(response.status()).isEqualTo(SickLeaveStatus.CLOSED);
            verify(auditService).logStatusChange("SickLeave", sickLeaveId,
                    SickLeaveStatus.OPEN.name(), SickLeaveStatus.CLOSED.name());
        }

        @Test
        @DisplayName("Should throw when closing already closed sick leave")
        void closeSickLeave_AlreadyClosed_Throws() {
            testSickLeave.setStatus(SickLeaveStatus.CLOSED);
            when(sickLeaveRepository.findById(sickLeaveId)).thenReturn(Optional.of(testSickLeave));

            assertThatThrownBy(() -> sickLeaveService.closeSickLeave(sickLeaveId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Закрыть можно только открытый больничный лист");
        }
    }

    @Nested
    @DisplayName("Get Open Sick Leaves")
    class GetOpenSickLeavesTests {

        @Test
        @DisplayName("Should return open sick leaves")
        void getOpenSickLeaves_ReturnsList() {
            when(sickLeaveRepository.findByStatusAndDeletedFalse(SickLeaveStatus.OPEN))
                    .thenReturn(List.of(testSickLeave));

            List<SickLeaveResponse> result = sickLeaveService.getOpenSickLeaves();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).status()).isEqualTo(SickLeaveStatus.OPEN);
        }
    }
}
