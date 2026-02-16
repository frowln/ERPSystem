package com.privod.platform.modules.hrRussian;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.StaffingTable;
import com.privod.platform.modules.hrRussian.repository.StaffingTableRepository;
import com.privod.platform.modules.hrRussian.service.StaffingTableService;
import com.privod.platform.modules.hrRussian.web.dto.CreateStaffingTableRequest;
import com.privod.platform.modules.hrRussian.web.dto.StaffingTableResponse;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffingTableServiceTest {

    @Mock
    private StaffingTableRepository staffingTableRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private StaffingTableService staffingTableService;

    private UUID positionId;
    private StaffingTable testPosition;

    @BeforeEach
    void setUp() {
        positionId = UUID.randomUUID();

        testPosition = StaffingTable.builder()
                .positionName("Инженер-строитель")
                .departmentId(UUID.randomUUID())
                .grade("С3")
                .salaryMin(new BigDecimal("70000.00"))
                .salaryMax(new BigDecimal("100000.00"))
                .headcount(5)
                .filledCount(3)
                .active(true)
                .effectiveDate(LocalDate.of(2025, 1, 1))
                .build();
        testPosition.setId(positionId);
        testPosition.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Position")
    class CreatePositionTests {

        @Test
        @DisplayName("Should create staffing table position with active status")
        void createPosition_SetsActiveAndZeroFilled() {
            CreateStaffingTableRequest request = new CreateStaffingTableRequest(
                    "Прораб", UUID.randomUUID(), "С4",
                    new BigDecimal("90000.00"), new BigDecimal("120000.00"),
                    3, LocalDate.of(2025, 2, 1));

            when(staffingTableRepository.save(any(StaffingTable.class))).thenAnswer(inv -> {
                StaffingTable st = inv.getArgument(0);
                st.setId(UUID.randomUUID());
                st.setCreatedAt(Instant.now());
                return st;
            });

            StaffingTableResponse response = staffingTableService.createPosition(request);

            assertThat(response.active()).isTrue();
            assertThat(response.filledCount()).isEqualTo(0);
            assertThat(response.vacancyCount()).isEqualTo(3);
            assertThat(response.positionName()).isEqualTo("Прораб");
            verify(auditService).logCreate(eq("StaffingTable"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Vacant Positions")
    class VacantPositionsTests {

        @Test
        @DisplayName("Should return vacant positions with correct vacancy count")
        void getVacantPositions_ReturnsCorrectVacancyCount() {
            when(staffingTableRepository.findVacantPositions())
                    .thenReturn(List.of(testPosition));

            List<StaffingTableResponse> result = staffingTableService.getVacantPositions();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).vacancyCount()).isEqualTo(2);
            assertThat(result.get(0).headcount()).isEqualTo(5);
            assertThat(result.get(0).filledCount()).isEqualTo(3);
        }
    }
}
