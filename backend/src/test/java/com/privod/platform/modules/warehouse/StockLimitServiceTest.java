package com.privod.platform.modules.warehouse;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockLimit;
import com.privod.platform.modules.warehouse.domain.StockLimitAlert;
import com.privod.platform.modules.warehouse.domain.StockLimitType;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitAlertRepository;
import com.privod.platform.modules.warehouse.repository.StockLimitRepository;
import com.privod.platform.modules.warehouse.service.StockLimitService;
import com.privod.platform.modules.warehouse.web.dto.CreateStockLimitRequest;
import com.privod.platform.modules.warehouse.web.dto.StockLimitAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.StockLimitResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockLimitRequest;
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
class StockLimitServiceTest {

    @Mock
    private StockLimitRepository stockLimitRepository;

    @Mock
    private StockLimitAlertRepository stockLimitAlertRepository;

    @Mock
    private StockEntryRepository stockEntryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private StockLimitService stockLimitService;

    private UUID limitId;
    private UUID materialId;
    private UUID warehouseLocationId;
    private StockLimit testLimit;

    @BeforeEach
    void setUp() {
        limitId = UUID.randomUUID();
        materialId = UUID.randomUUID();
        warehouseLocationId = UUID.randomUUID();

        testLimit = StockLimit.builder()
                .materialId(materialId)
                .warehouseLocationId(warehouseLocationId)
                .minQuantity(new BigDecimal("10.000"))
                .maxQuantity(new BigDecimal("1000.000"))
                .reorderPoint(new BigDecimal("50.000"))
                .reorderQuantity(new BigDecimal("200.000"))
                .unit("шт")
                .isActive(true)
                .build();
        testLimit.setId(limitId);
        testLimit.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Limit")
    class CreateLimitTests {

        @Test
        @DisplayName("Should create stock limit with isActive = true")
        void createLimit_SetsActiveTrue() {
            CreateStockLimitRequest request = new CreateStockLimitRequest(
                    materialId, warehouseLocationId,
                    new BigDecimal("5.000"), new BigDecimal("500.000"),
                    new BigDecimal("20.000"), new BigDecimal("100.000"), "м3"
            );

            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> {
                StockLimit l = inv.getArgument(0);
                l.setId(UUID.randomUUID());
                l.setCreatedAt(Instant.now());
                return l;
            });

            StockLimitResponse response = stockLimitService.createLimit(request);

            assertThat(response.isActive()).isTrue();
            assertThat(response.materialId()).isEqualTo(materialId);
            assertThat(response.minQuantity()).isEqualByComparingTo(new BigDecimal("5.000"));
            assertThat(response.maxQuantity()).isEqualByComparingTo(new BigDecimal("500.000"));
            assertThat(response.unit()).isEqualTo("м3");
            verify(auditService).logCreate(eq("StockLimit"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Check Limits - Generate Alerts")
    class CheckLimitsTests {

        @Test
        @DisplayName("Should generate CRITICAL alert when stock is below minimum")
        void checkLimits_BelowMin_GeneratesCriticalAlert() {
            StockEntry entry = StockEntry.builder()
                    .materialId(materialId)
                    .locationId(warehouseLocationId)
                    .materialName("Арматура А500")
                    .quantity(new BigDecimal("5.000"))
                    .build();
            entry.setId(UUID.randomUUID());

            when(stockLimitRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testLimit));
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, warehouseLocationId))
                    .thenReturn(Optional.of(entry));
            when(stockLimitAlertRepository.save(any(StockLimitAlert.class))).thenAnswer(inv -> {
                StockLimitAlert a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> inv.getArgument(0));

            List<StockLimitAlertResponse> alerts = stockLimitService.checkLimits();

            assertThat(alerts).isNotEmpty();
            assertThat(alerts).anyMatch(a -> a.limitType() == StockLimitType.BELOW_MIN
                    && a.severity() == StockAlertSeverity.CRITICAL);
        }

        @Test
        @DisplayName("Should generate WARNING alert when stock exceeds maximum")
        void checkLimits_AboveMax_GeneratesWarningAlert() {
            StockEntry entry = StockEntry.builder()
                    .materialId(materialId)
                    .locationId(warehouseLocationId)
                    .materialName("Цемент М500")
                    .quantity(new BigDecimal("1500.000"))
                    .build();
            entry.setId(UUID.randomUUID());

            when(stockLimitRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testLimit));
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, warehouseLocationId))
                    .thenReturn(Optional.of(entry));
            when(stockLimitAlertRepository.save(any(StockLimitAlert.class))).thenAnswer(inv -> {
                StockLimitAlert a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> inv.getArgument(0));

            List<StockLimitAlertResponse> alerts = stockLimitService.checkLimits();

            assertThat(alerts).anyMatch(a -> a.limitType() == StockLimitType.ABOVE_MAX
                    && a.severity() == StockAlertSeverity.WARNING);
        }

        @Test
        @DisplayName("Should generate REORDER_POINT alert when stock at reorder point")
        void checkLimits_AtReorderPoint_GeneratesInfoAlert() {
            StockEntry entry = StockEntry.builder()
                    .materialId(materialId)
                    .locationId(warehouseLocationId)
                    .materialName("Кирпич")
                    .quantity(new BigDecimal("50.000"))
                    .build();
            entry.setId(UUID.randomUUID());

            // Set up limit so below-min does not trigger (set min to 5)
            testLimit.setMinQuantity(new BigDecimal("5.000"));

            when(stockLimitRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testLimit));
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, warehouseLocationId))
                    .thenReturn(Optional.of(entry));
            when(stockLimitAlertRepository.save(any(StockLimitAlert.class))).thenAnswer(inv -> {
                StockLimitAlert a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> inv.getArgument(0));

            List<StockLimitAlertResponse> alerts = stockLimitService.checkLimits();

            assertThat(alerts).anyMatch(a -> a.limitType() == StockLimitType.REORDER_POINT
                    && a.severity() == StockAlertSeverity.INFO);
        }

        @Test
        @DisplayName("Should return empty list when no stock entry found and limits are ok")
        void checkLimits_NoEntry_UsesZeroQuantity() {
            // When no stock entry exists, quantity defaults to ZERO which is below min=10
            when(stockLimitRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(testLimit));
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, warehouseLocationId))
                    .thenReturn(Optional.empty());
            when(stockLimitAlertRepository.save(any(StockLimitAlert.class))).thenAnswer(inv -> {
                StockLimitAlert a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> inv.getArgument(0));

            List<StockLimitAlertResponse> alerts = stockLimitService.checkLimits();

            assertThat(alerts).isNotEmpty();
            assertThat(alerts).anyMatch(a -> a.limitType() == StockLimitType.BELOW_MIN);
        }
    }

    @Nested
    @DisplayName("Acknowledge Alert")
    class AcknowledgeAlertTests {

        @Test
        @DisplayName("Should acknowledge alert and mark as resolved")
        void acknowledgeAlert_Success() {
            UUID alertId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            StockLimitAlert alert = StockLimitAlert.builder()
                    .stockLimitId(limitId)
                    .materialId(materialId)
                    .materialName("Песок")
                    .currentQuantity(new BigDecimal("3.000"))
                    .limitType(StockLimitType.BELOW_MIN)
                    .severity(StockAlertSeverity.CRITICAL)
                    .isResolved(false)
                    .build();
            alert.setId(alertId);
            alert.setCreatedAt(Instant.now());

            when(stockLimitAlertRepository.findById(alertId)).thenReturn(Optional.of(alert));
            when(stockLimitAlertRepository.save(any(StockLimitAlert.class))).thenAnswer(inv -> inv.getArgument(0));

            StockLimitAlertResponse response = stockLimitService.acknowledgeAlert(alertId, userId);

            assertThat(response.isResolved()).isTrue();
            assertThat(response.acknowledgedById()).isEqualTo(userId);
            assertThat(response.acknowledgedAt()).isNotNull();
            verify(auditService).logUpdate("StockLimitAlert", alertId, "isResolved", "false", "true");
        }

        @Test
        @DisplayName("Should throw when alert not found")
        void acknowledgeAlert_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(stockLimitAlertRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> stockLimitService.acknowledgeAlert(nonExistentId, UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Оповещение не найдено");
        }
    }

    @Nested
    @DisplayName("Update Limit")
    class UpdateLimitTests {

        @Test
        @DisplayName("Should update limit fields selectively")
        void updateLimit_PartialUpdate() {
            UpdateStockLimitRequest request = new UpdateStockLimitRequest(
                    new BigDecimal("20.000"), null, null, null, "тонн", null
            );

            when(stockLimitRepository.findById(limitId)).thenReturn(Optional.of(testLimit));
            when(stockLimitRepository.save(any(StockLimit.class))).thenAnswer(inv -> inv.getArgument(0));

            StockLimitResponse response = stockLimitService.updateLimit(limitId, request);

            assertThat(response.minQuantity()).isEqualByComparingTo(new BigDecimal("20.000"));
            assertThat(response.maxQuantity()).isEqualByComparingTo(new BigDecimal("1000.000"));
            assertThat(response.unit()).isEqualTo("тонн");
            verify(auditService).logUpdate("StockLimit", limitId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should throw when limit not found")
        void updateLimit_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(stockLimitRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> stockLimitService.updateLimit(nonExistentId,
                    new UpdateStockLimitRequest(null, null, null, null, null, null)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Лимит запаса не найден");
        }
    }
}
