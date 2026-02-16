package com.privod.platform.modules.hrRussian;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.BusinessTrip;
import com.privod.platform.modules.hrRussian.domain.BusinessTripStatus;
import com.privod.platform.modules.hrRussian.repository.BusinessTripRepository;
import com.privod.platform.modules.hrRussian.service.BusinessTripService;
import com.privod.platform.modules.hrRussian.web.dto.BusinessTripResponse;
import com.privod.platform.modules.hrRussian.web.dto.CreateBusinessTripRequest;
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
class BusinessTripServiceTest {

    @Mock
    private BusinessTripRepository businessTripRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BusinessTripService businessTripService;

    private UUID tripId;
    private UUID employeeId;
    private BusinessTrip testTrip;

    @BeforeEach
    void setUp() {
        tripId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        testTrip = BusinessTrip.builder()
                .employeeId(employeeId)
                .destination("Москва, ул. Строителей, 25")
                .purpose("Инспекция строительного объекта")
                .startDate(LocalDate.of(2025, 4, 10))
                .endDate(LocalDate.of(2025, 4, 15))
                .dailyAllowance(new BigDecimal("700.00"))
                .totalBudget(new BigDecimal("50000.00"))
                .status(BusinessTripStatus.PLANNED)
                .build();
        testTrip.setId(tripId);
        testTrip.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Business Trip")
    class CreateTripTests {

        @Test
        @DisplayName("Should create business trip with PLANNED status")
        void createTrip_SetsPlannedStatus() {
            CreateBusinessTripRequest request = new CreateBusinessTripRequest(
                    employeeId, "Казань, ЖК Новая Звезда",
                    "Проверка хода строительства",
                    LocalDate.of(2025, 5, 1), LocalDate.of(2025, 5, 5),
                    new BigDecimal("700.00"), new BigDecimal("45000.00"), null);

            when(businessTripRepository.save(any(BusinessTrip.class))).thenAnswer(inv -> {
                BusinessTrip t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            BusinessTripResponse response = businessTripService.createBusinessTrip(request);

            assertThat(response.status()).isEqualTo(BusinessTripStatus.PLANNED);
            assertThat(response.statusDisplayName()).isEqualTo("Запланирована");
            assertThat(response.destination()).isEqualTo("Казань, ЖК Новая Звезда");
            assertThat(response.daysCount()).isEqualTo(5);
            verify(auditService).logCreate(eq("BusinessTrip"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Approve Business Trip")
    class ApproveTripTests {

        @Test
        @DisplayName("Should approve planned trip")
        void approveTrip_PlannedTrip_Success() {
            when(businessTripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(businessTripRepository.save(any(BusinessTrip.class))).thenAnswer(inv -> inv.getArgument(0));

            BusinessTripResponse response = businessTripService.approveTrip(tripId);

            assertThat(response.status()).isEqualTo(BusinessTripStatus.APPROVED);
            verify(auditService).logStatusChange("BusinessTrip", tripId,
                    BusinessTripStatus.PLANNED.name(), BusinessTripStatus.APPROVED.name());
        }

        @Test
        @DisplayName("Should throw when approving non-planned trip")
        void approveTrip_NotPlanned_Throws() {
            testTrip.setStatus(BusinessTripStatus.ACTIVE);
            when(businessTripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            assertThatThrownBy(() -> businessTripService.approveTrip(tripId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утвердить можно только запланированную командировку");
        }
    }

    @Nested
    @DisplayName("Complete Business Trip")
    class CompleteTripTests {

        @Test
        @DisplayName("Should complete approved trip")
        void completeTrip_ApprovedTrip_Success() {
            testTrip.setStatus(BusinessTripStatus.APPROVED);
            when(businessTripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(businessTripRepository.save(any(BusinessTrip.class))).thenAnswer(inv -> inv.getArgument(0));

            BusinessTripResponse response = businessTripService.completeTrip(tripId);

            assertThat(response.status()).isEqualTo(BusinessTripStatus.COMPLETED);
        }

        @Test
        @DisplayName("Should throw when completing planned trip")
        void completeTrip_PlannedTrip_Throws() {
            when(businessTripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            assertThatThrownBy(() -> businessTripService.completeTrip(tripId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Завершить можно только активную или утверждённую командировку");
        }
    }

    @Nested
    @DisplayName("Get Business Trip")
    class GetTripTests {

        @Test
        @DisplayName("Should return trip by ID")
        void getTrip_Success() {
            when(businessTripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            BusinessTripResponse response = businessTripService.getBusinessTrip(tripId);

            assertThat(response).isNotNull();
            assertThat(response.destination()).isEqualTo("Москва, ул. Строителей, 25");
        }

        @Test
        @DisplayName("Should throw when trip not found")
        void getTrip_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(businessTripRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> businessTripService.getBusinessTrip(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Командировка не найдена");
        }

        @Test
        @DisplayName("Should return active trips list")
        void getActiveTrips_ReturnsList() {
            testTrip.setStatus(BusinessTripStatus.ACTIVE);
            when(businessTripRepository.findByStatusAndDeletedFalse(BusinessTripStatus.ACTIVE))
                    .thenReturn(List.of(testTrip));

            List<BusinessTripResponse> result = businessTripService.getActiveTrips();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).status()).isEqualTo(BusinessTripStatus.ACTIVE);
        }
    }
}
