package com.privod.platform.modules.hrRussian;

import com.privod.platform.modules.hrRussian.domain.BusinessTrip;
import com.privod.platform.modules.hrRussian.domain.BusinessTripStatus;
import com.privod.platform.modules.hrRussian.domain.CertificateStatus;
import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.domain.ContractType;
import com.privod.platform.modules.hrRussian.domain.EmploymentContract;
import com.privod.platform.modules.hrRussian.domain.HrCrewAssignment;
import com.privod.platform.modules.hrRussian.domain.HrEmployeeCertificate;
import com.privod.platform.modules.hrRussian.domain.SalaryType;
import com.privod.platform.modules.hrRussian.domain.SickLeave;
import com.privod.platform.modules.hrRussian.domain.SickLeaveStatus;
import com.privod.platform.modules.hrRussian.domain.StaffingTable;
import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.domain.VacationStatus;
import com.privod.platform.modules.hrRussian.domain.VacationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class DomainEntityTest {

    @Test
    @DisplayName("EmploymentContract.isExpired should return true when end date is past")
    void employmentContract_IsExpired_PastEndDate() {
        EmploymentContract contract = EmploymentContract.builder()
                .employeeId(UUID.randomUUID())
                .contractNumber("ТД-001")
                .contractType(ContractType.СРОЧНЫЙ)
                .startDate(LocalDate.of(2023, 1, 1))
                .endDate(LocalDate.of(2024, 1, 1))
                .salary(BigDecimal.ZERO)
                .salaryType(SalaryType.ОКЛАД)
                .status(ContractStatus.ACTIVE)
                .build();

        assertThat(contract.isExpired()).isTrue();
    }

    @Test
    @DisplayName("EmploymentContract.isOnProbation should return true during probation period")
    void employmentContract_IsOnProbation_DuringProbation() {
        EmploymentContract contract = EmploymentContract.builder()
                .employeeId(UUID.randomUUID())
                .contractNumber("ТД-002")
                .contractType(ContractType.БЕССРОЧНЫЙ)
                .startDate(LocalDate.now().minusDays(10))
                .salary(BigDecimal.ZERO)
                .salaryType(SalaryType.ОКЛАД)
                .probationEndDate(LocalDate.now().plusDays(80))
                .status(ContractStatus.ACTIVE)
                .build();

        assertThat(contract.isOnProbation()).isTrue();
    }

    @Test
    @DisplayName("SickLeave.getDaysCount should calculate correctly")
    void sickLeave_GetDaysCount() {
        SickLeave sickLeave = SickLeave.builder()
                .employeeId(UUID.randomUUID())
                .startDate(LocalDate.of(2025, 3, 1))
                .endDate(LocalDate.of(2025, 3, 10))
                .status(SickLeaveStatus.OPEN)
                .build();

        assertThat(sickLeave.getDaysCount()).isEqualTo(10);
    }

    @Test
    @DisplayName("BusinessTrip.getDaysCount should calculate correctly")
    void businessTrip_GetDaysCount() {
        BusinessTrip trip = BusinessTrip.builder()
                .employeeId(UUID.randomUUID())
                .destination("Москва")
                .purpose("Инспекция")
                .startDate(LocalDate.of(2025, 4, 1))
                .endDate(LocalDate.of(2025, 4, 5))
                .status(BusinessTripStatus.PLANNED)
                .build();

        assertThat(trip.getDaysCount()).isEqualTo(5);
    }

    @Test
    @DisplayName("StaffingTable.getVacancyCount should compute correctly")
    void staffingTable_GetVacancyCount() {
        StaffingTable position = StaffingTable.builder()
                .positionName("Инженер")
                .headcount(10)
                .filledCount(7)
                .effectiveDate(LocalDate.now())
                .build();

        assertThat(position.getVacancyCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("HrEmployeeCertificate.isExpired should return true for past expiry")
    void hrEmployeeCertificate_IsExpired() {
        HrEmployeeCertificate cert = HrEmployeeCertificate.builder()
                .employeeId(UUID.randomUUID())
                .certificateName("Удостоверение по ОТ")
                .issuedDate(LocalDate.of(2023, 1, 1))
                .expiryDate(LocalDate.of(2024, 1, 1))
                .status(CertificateStatus.VALID)
                .build();

        assertThat(cert.isExpired()).isTrue();
    }

    @Test
    @DisplayName("HrEmployeeCertificate.isExpiring should detect certificates expiring within threshold")
    void hrEmployeeCertificate_IsExpiring() {
        HrEmployeeCertificate cert = HrEmployeeCertificate.builder()
                .employeeId(UUID.randomUUID())
                .certificateName("Медосмотр")
                .issuedDate(LocalDate.now().minusMonths(11))
                .expiryDate(LocalDate.now().plusDays(15))
                .status(CertificateStatus.VALID)
                .build();

        assertThat(cert.isExpiring(30)).isTrue();
        assertThat(cert.isExpiring(10)).isFalse();
    }

    @Test
    @DisplayName("HrCrewAssignment.isCurrentlyActive should check date range")
    void hrCrewAssignment_IsCurrentlyActive() {
        HrCrewAssignment assignment = HrCrewAssignment.builder()
                .crewId(UUID.randomUUID())
                .employeeId(UUID.randomUUID())
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(10))
                .build();

        assertThat(assignment.isCurrentlyActive()).isTrue();

        HrCrewAssignment pastAssignment = HrCrewAssignment.builder()
                .crewId(UUID.randomUUID())
                .employeeId(UUID.randomUUID())
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 6, 30))
                .build();

        assertThat(pastAssignment.isCurrentlyActive()).isFalse();
    }

    @Test
    @DisplayName("Vacation.isActive should check date range and status")
    void vacation_IsActive() {
        Vacation activeVacation = Vacation.builder()
                .employeeId(UUID.randomUUID())
                .vacationType(VacationType.ЕЖЕГОДНЫЙ)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusDays(5))
                .daysCount(10)
                .status(VacationStatus.ACTIVE)
                .build();

        assertThat(activeVacation.isActive()).isTrue();

        Vacation plannedVacation = Vacation.builder()
                .employeeId(UUID.randomUUID())
                .vacationType(VacationType.ЕЖЕГОДНЫЙ)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusDays(5))
                .daysCount(10)
                .status(VacationStatus.PLANNED)
                .build();

        assertThat(plannedVacation.isActive()).isFalse();
    }

    @Test
    @DisplayName("Enum displayName values should be correct")
    void enumDisplayNames_Correct() {
        assertThat(ContractType.БЕССРОЧНЫЙ.getDisplayName()).isEqualTo("Бессрочный трудовой договор");
        assertThat(ContractType.СРОЧНЫЙ.getDisplayName()).isEqualTo("Срочный трудовой договор");
        assertThat(ContractType.ГПХ.getDisplayName()).isEqualTo("Договор гражданско-правового характера");
        assertThat(SalaryType.ОКЛАД.getDisplayName()).isEqualTo("Оклад (месячный)");
        assertThat(SalaryType.ЧАСОВАЯ.getDisplayName()).isEqualTo("Часовая ставка");
        assertThat(SalaryType.СДЕЛЬНАЯ.getDisplayName()).isEqualTo("Сдельная оплата");
        assertThat(VacationType.ДЕКРЕТНЫЙ.getDisplayName()).isEqualTo("Декретный (по беременности и родам)");
        assertThat(VacationType.БЕЗ_СОДЕРЖАНИЯ.getDisplayName()).isEqualTo("Без сохранения заработной платы");
    }
}
