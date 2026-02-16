package com.privod.platform.modules.hrRussian;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.domain.VacationStatus;
import com.privod.platform.modules.hrRussian.domain.VacationType;
import com.privod.platform.modules.hrRussian.repository.VacationRepository;
import com.privod.platform.modules.hrRussian.service.VacationService;
import com.privod.platform.modules.hrRussian.web.dto.CreateVacationRequest;
import com.privod.platform.modules.hrRussian.web.dto.VacationResponse;
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
class VacationServiceTest {

    @Mock
    private VacationRepository vacationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private VacationService vacationService;

    private UUID vacationId;
    private UUID employeeId;
    private Vacation testVacation;

    @BeforeEach
    void setUp() {
        vacationId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        testVacation = Vacation.builder()
                .employeeId(employeeId)
                .vacationType(VacationType.ЕЖЕГОДНЫЙ)
                .startDate(LocalDate.of(2025, 7, 1))
                .endDate(LocalDate.of(2025, 7, 28))
                .daysCount(28)
                .status(VacationStatus.PLANNED)
                .build();
        testVacation.setId(vacationId);
        testVacation.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Vacation")
    class CreateVacationTests {

        @Test
        @DisplayName("Should create vacation with PLANNED status")
        void createVacation_SetsPlannedStatus() {
            CreateVacationRequest request = new CreateVacationRequest(
                    employeeId, VacationType.ЕЖЕГОДНЫЙ,
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 28),
                    28, null, null);

            when(vacationRepository.findByEmployeeAndDateRange(
                    eq(employeeId), any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            when(vacationRepository.save(any(Vacation.class))).thenAnswer(inv -> {
                Vacation v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            VacationResponse response = vacationService.createVacation(request);

            assertThat(response.status()).isEqualTo(VacationStatus.PLANNED);
            assertThat(response.vacationTypeDisplayName()).isEqualTo("Ежегодный оплачиваемый");
            assertThat(response.daysCount()).isEqualTo(28);
            verify(auditService).logCreate(eq("Vacation"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when overlapping vacation exists")
        void createVacation_Overlapping_Throws() {
            CreateVacationRequest request = new CreateVacationRequest(
                    employeeId, VacationType.ЕЖЕГОДНЫЙ,
                    LocalDate.of(2025, 7, 10), LocalDate.of(2025, 7, 20),
                    10, null, null);

            when(vacationRepository.findByEmployeeAndDateRange(
                    eq(employeeId), any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(testVacation));

            assertThatThrownBy(() -> vacationService.createVacation(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже есть отпуск на указанные даты");
        }
    }

    @Nested
    @DisplayName("Approve Vacation")
    class ApproveVacationTests {

        @Test
        @DisplayName("Should approve planned vacation")
        void approveVacation_PlannedVacation_Success() {
            when(vacationRepository.findById(vacationId)).thenReturn(Optional.of(testVacation));
            when(vacationRepository.save(any(Vacation.class))).thenAnswer(inv -> inv.getArgument(0));

            VacationResponse response = vacationService.approveVacation(vacationId);

            assertThat(response.status()).isEqualTo(VacationStatus.APPROVED);
            verify(auditService).logStatusChange("Vacation", vacationId,
                    VacationStatus.PLANNED.name(), VacationStatus.APPROVED.name());
        }

        @Test
        @DisplayName("Should throw when approving non-planned vacation")
        void approveVacation_NotPlanned_Throws() {
            testVacation.setStatus(VacationStatus.APPROVED);
            when(vacationRepository.findById(vacationId)).thenReturn(Optional.of(testVacation));

            assertThatThrownBy(() -> vacationService.approveVacation(vacationId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утвердить можно только запланированный отпуск");
        }
    }

    @Nested
    @DisplayName("Cancel Vacation")
    class CancelVacationTests {

        @Test
        @DisplayName("Should cancel planned vacation")
        void cancelVacation_Success() {
            when(vacationRepository.findById(vacationId)).thenReturn(Optional.of(testVacation));
            when(vacationRepository.save(any(Vacation.class))).thenAnswer(inv -> inv.getArgument(0));

            VacationResponse response = vacationService.cancelVacation(vacationId);

            assertThat(response.status()).isEqualTo(VacationStatus.CANCELLED);
        }

        @Test
        @DisplayName("Should throw when cancelling completed vacation")
        void cancelVacation_Completed_Throws() {
            testVacation.setStatus(VacationStatus.COMPLETED);
            when(vacationRepository.findById(vacationId)).thenReturn(Optional.of(testVacation));

            assertThatThrownBy(() -> vacationService.cancelVacation(vacationId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Нельзя отменить завершённый отпуск");
        }
    }

    @Nested
    @DisplayName("Get Vacation")
    class GetVacationTests {

        @Test
        @DisplayName("Should throw when vacation not found")
        void getVacation_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(vacationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vacationService.getVacation(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Отпуск не найден");
        }
    }
}
