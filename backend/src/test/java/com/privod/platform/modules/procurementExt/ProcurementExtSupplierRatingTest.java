package com.privod.platform.modules.procurementExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurementExt.domain.MaterialReservation;
import com.privod.platform.modules.procurementExt.domain.ReservationStatus;
import com.privod.platform.modules.procurementExt.domain.SupplierRating;
import com.privod.platform.modules.procurementExt.repository.DeliveryItemRepository;
import com.privod.platform.modules.procurementExt.repository.DeliveryRepository;
import com.privod.platform.modules.procurementExt.repository.DispatchItemRepository;
import com.privod.platform.modules.procurementExt.repository.ProcurementDispatchOrderRepository;
import com.privod.platform.modules.procurementExt.repository.MaterialReservationRepository;
import com.privod.platform.modules.procurementExt.repository.SupplierRatingRepository;
import com.privod.platform.modules.procurementExt.service.ProcurementExtService;
import com.privod.platform.modules.procurementExt.web.dto.CreateSupplierRatingRequest;
import com.privod.platform.modules.procurementExt.web.dto.SupplierRatingResponse;
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
class ProcurementExtSupplierRatingTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryItemRepository deliveryItemRepository;

    @Mock
    private ProcurementDispatchOrderRepository dispatchOrderRepository;

    @Mock
    private DispatchItemRepository dispatchItemRepository;

    @Mock
    private MaterialReservationRepository materialReservationRepository;

    @Mock
    private SupplierRatingRepository supplierRatingRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProcurementExtService service;

    private UUID supplierId;

    @BeforeEach
    void setUp() {
        supplierId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("Supplier Ratings")
    class RatingTests {

        @Test
        @DisplayName("Should create supplier rating and compute overall score")
        void createRating_ComputesOverall() {
            CreateSupplierRatingRequest request = new CreateSupplierRatingRequest(
                    supplierId, "2025-Q3",
                    new BigDecimal("8.50"), new BigDecimal("7.00"), new BigDecimal("9.00"),
                    UUID.randomUUID(), "Хороший поставщик");

            when(supplierRatingRepository.save(any(SupplierRating.class))).thenAnswer(invocation -> {
                SupplierRating sr = invocation.getArgument(0);
                sr.setId(UUID.randomUUID());
                sr.setCreatedAt(Instant.now());
                return sr;
            });

            SupplierRatingResponse response = service.createRating(request);

            assertThat(response.qualityScore()).isEqualByComparingTo(new BigDecimal("8.50"));
            assertThat(response.deliveryScore()).isEqualByComparingTo(new BigDecimal("7.00"));
            assertThat(response.priceScore()).isEqualByComparingTo(new BigDecimal("9.00"));
            // (8.50 + 7.00 + 9.00) / 3 = 8.17
            assertThat(response.overallScore()).isEqualByComparingTo(new BigDecimal("8.17"));
            verify(auditService).logCreate(eq("SupplierRating"), any(UUID.class));
        }

        @Test
        @DisplayName("Should return ratings for supplier ordered by period")
        void getRatings_Success() {
            SupplierRating sr1 = SupplierRating.builder()
                    .supplierId(supplierId)
                    .periodId("2025-Q2")
                    .qualityScore(new BigDecimal("7.00"))
                    .deliveryScore(new BigDecimal("6.50"))
                    .priceScore(new BigDecimal("8.00"))
                    .overallScore(new BigDecimal("7.17"))
                    .build();
            sr1.setId(UUID.randomUUID());
            sr1.setCreatedAt(Instant.now());

            SupplierRating sr2 = SupplierRating.builder()
                    .supplierId(supplierId)
                    .periodId("2025-Q3")
                    .qualityScore(new BigDecimal("8.50"))
                    .deliveryScore(new BigDecimal("7.00"))
                    .priceScore(new BigDecimal("9.00"))
                    .overallScore(new BigDecimal("8.17"))
                    .build();
            sr2.setId(UUID.randomUUID());
            sr2.setCreatedAt(Instant.now());

            when(supplierRatingRepository.findBySupplierIdAndDeletedFalseOrderByPeriodIdDesc(supplierId))
                    .thenReturn(List.of(sr2, sr1));

            List<SupplierRatingResponse> ratings = service.getRatingsForSupplier(supplierId);

            assertThat(ratings).hasSize(2);
            assertThat(ratings.get(0).periodId()).isEqualTo("2025-Q3");
            assertThat(ratings.get(1).periodId()).isEqualTo("2025-Q2");
        }
    }

    @Nested
    @DisplayName("Material Reservations")
    class ReservationTests {

        @Test
        @DisplayName("Should release active reservation")
        void releaseReservation_Success() {
            UUID reservationId = UUID.randomUUID();
            MaterialReservation reservation = MaterialReservation.builder()
                    .materialId(UUID.randomUUID())
                    .projectId(UUID.randomUUID())
                    .quantity(new BigDecimal("100.000"))
                    .status(ReservationStatus.ACTIVE)
                    .build();
            reservation.setId(reservationId);

            when(materialReservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));
            when(materialReservationRepository.save(any(MaterialReservation.class))).thenAnswer(inv -> inv.getArgument(0));

            service.releaseReservation(reservationId);

            assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.RELEASED);
            verify(auditService).logStatusChange("MaterialReservation", reservationId, "ACTIVE", "RELEASED");
        }

        @Test
        @DisplayName("Should reject releasing non-active reservation")
        void releaseReservation_NotActive() {
            UUID reservationId = UUID.randomUUID();
            MaterialReservation reservation = MaterialReservation.builder()
                    .materialId(UUID.randomUUID())
                    .projectId(UUID.randomUUID())
                    .quantity(new BigDecimal("100.000"))
                    .status(ReservationStatus.RELEASED)
                    .build();
            reservation.setId(reservationId);

            when(materialReservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> service.releaseReservation(reservationId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно снять резервирование");
        }

        @Test
        @DisplayName("Should throw when reservation not found")
        void releaseReservation_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(materialReservationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.releaseReservation(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Резервирование не найдено");
        }

        @Test
        @DisplayName("Should expire overdue reservations")
        void expireOverdueReservations_Success() {
            MaterialReservation r1 = MaterialReservation.builder()
                    .materialId(UUID.randomUUID())
                    .projectId(UUID.randomUUID())
                    .quantity(new BigDecimal("50.000"))
                    .status(ReservationStatus.ACTIVE)
                    .expiresAt(Instant.now().minusSeconds(3600))
                    .build();
            r1.setId(UUID.randomUUID());

            when(materialReservationRepository.findByStatusAndExpiresAtBeforeAndDeletedFalse(
                    eq(ReservationStatus.ACTIVE), any(Instant.class)))
                    .thenReturn(List.of(r1));
            when(materialReservationRepository.save(any(MaterialReservation.class))).thenAnswer(inv -> inv.getArgument(0));

            service.expireOverdueReservations();

            assertThat(r1.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
            verify(auditService).logStatusChange("MaterialReservation", r1.getId(), "ACTIVE", "EXPIRED");
        }
    }
}
