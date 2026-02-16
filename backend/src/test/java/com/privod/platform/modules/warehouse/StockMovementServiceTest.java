package com.privod.platform.modules.warehouse;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementLineRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.service.StockMovementService;
import com.privod.platform.modules.warehouse.service.StockService;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementLineRequest;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementRequest;
import com.privod.platform.modules.warehouse.web.dto.LowStockAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.StockMovementLineResponse;
import com.privod.platform.modules.warehouse.web.dto.StockMovementResponse;
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
class StockMovementServiceTest {

    @Mock
    private StockMovementRepository movementRepository;

    @Mock
    private StockMovementLineRepository lineRepository;

    @Mock
    private StockEntryRepository stockEntryRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private StockMovementService movementService;

    private UUID movementId;
    private UUID materialId;
    private UUID sourceLocationId;
    private UUID destinationLocationId;
    private UUID projectId;
    private StockMovement testMovement;
    private Material testMaterial;
    private StockEntry testStockEntry;

    @BeforeEach
    void setUp() {
        movementId = UUID.randomUUID();
        materialId = UUID.randomUUID();
        sourceLocationId = UUID.randomUUID();
        destinationLocationId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testMovement = StockMovement.builder()
                .number("MOV-00001")
                .movementDate(LocalDate.of(2025, 6, 15))
                .movementType(StockMovementType.RECEIPT)
                .status(StockMovementStatus.DRAFT)
                .projectId(projectId)
                .destinationLocationId(destinationLocationId)
                .responsibleName("Иванов И.И.")
                .build();
        testMovement.setId(movementId);
        testMovement.setCreatedAt(Instant.now());

        testMaterial = Material.builder()
                .name("Цемент М500")
                .code("CEM-500")
                .category(MaterialCategory.CONCRETE)
                .unitOfMeasure("кг")
                .minStockLevel(new BigDecimal("100.000"))
                .currentPrice(new BigDecimal("15.50"))
                .active(true)
                .build();
        testMaterial.setId(materialId);
        testMaterial.setCreatedAt(Instant.now());

        testStockEntry = StockEntry.builder()
                .materialId(materialId)
                .materialName("Цемент М500")
                .locationId(sourceLocationId)
                .quantity(new BigDecimal("500.000"))
                .reservedQuantity(BigDecimal.ZERO)
                .availableQuantity(new BigDecimal("500.000"))
                .lastPricePerUnit(new BigDecimal("15.50"))
                .totalValue(new BigDecimal("7750.00"))
                .build();
        testStockEntry.setId(UUID.randomUUID());
        testStockEntry.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Movement")
    class CreateMovementTests {

        @Test
        @DisplayName("Should create a receipt movement with DRAFT status")
        void createMovement_Receipt_Success() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.of(2025, 7, 1),
                    StockMovementType.RECEIPT,
                    projectId,
                    null,
                    destinationLocationId,
                    null,
                    null,
                    UUID.randomUUID(),
                    "Петров П.П.",
                    "Приход материалов со склада поставщика"
            );

            when(movementRepository.getNextNumberSequence()).thenReturn(1L);
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
                StockMovement m = invocation.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            StockMovementResponse response = movementService.createMovement(request);

            assertThat(response.status()).isEqualTo(StockMovementStatus.DRAFT);
            assertThat(response.movementType()).isEqualTo(StockMovementType.RECEIPT);
            assertThat(response.number()).isEqualTo("MOV-00001");
            verify(auditService).logCreate(eq("StockMovement"), any(UUID.class));
        }

        @Test
        @DisplayName("Should fail to create transfer without source location")
        void createMovement_Transfer_NoSource() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.of(2025, 7, 1),
                    StockMovementType.TRANSFER,
                    projectId,
                    null, // missing source
                    destinationLocationId,
                    null, null, null, null, null
            );

            assertThatThrownBy(() -> movementService.createMovement(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Для перемещения необходимо указать оба склада");
        }
    }

    @Nested
    @DisplayName("Add Line")
    class AddLineTests {

        @Test
        @DisplayName("Should add a line to a DRAFT movement")
        void addLine_Success() {
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));
            when(lineRepository.save(any(StockMovementLine.class))).thenAnswer(invocation -> {
                StockMovementLine line = invocation.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            CreateStockMovementLineRequest request = new CreateStockMovementLineRequest(
                    materialId, null, 1,
                    new BigDecimal("100.000"),
                    new BigDecimal("15.50"),
                    "кг", "Цемент для фундамента"
            );

            StockMovementLineResponse response = movementService.addLine(movementId, request);

            assertThat(response.materialId()).isEqualTo(materialId);
            assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("100.000"));
            assertThat(response.totalPrice()).isEqualByComparingTo(new BigDecimal("1550.000"));
            assertThat(response.materialName()).isEqualTo("Цемент М500");
        }

        @Test
        @DisplayName("Should reject adding line to non-DRAFT movement")
        void addLine_NotDraft() {
            testMovement.setStatus(StockMovementStatus.CONFIRMED);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            CreateStockMovementLineRequest request = new CreateStockMovementLineRequest(
                    materialId, null, 1,
                    new BigDecimal("100.000"),
                    new BigDecimal("15.50"),
                    "кг", null
            );

            assertThatThrownBy(() -> movementService.addLine(movementId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Добавление строк возможно только в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("Confirm Movement")
    class ConfirmMovementTests {

        @Test
        @DisplayName("Should confirm a DRAFT movement with lines")
        void confirmMovement_Success() {
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            StockMovementLine line = StockMovementLine.builder()
                    .movementId(movementId)
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .quantity(new BigDecimal("100.000"))
                    .unitPrice(new BigDecimal("15.50"))
                    .totalPrice(new BigDecimal("1550.000"))
                    .build();
            line.setId(UUID.randomUUID());

            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of(line));
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

            StockMovementResponse response = movementService.confirmMovement(movementId);

            assertThat(response.status()).isEqualTo(StockMovementStatus.CONFIRMED);
            verify(auditService).logStatusChange("StockMovement", movementId, "DRAFT", "CONFIRMED");
        }

        @Test
        @DisplayName("Should reject confirming movement without lines")
        void confirmMovement_NoLines() {
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of());

            assertThatThrownBy(() -> movementService.confirmMovement(movementId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно подтвердить движение без строк");
        }

        @Test
        @DisplayName("Should reject confirming ISSUE when insufficient stock")
        void confirmMovement_InsufficientStock() {
            testMovement.setMovementType(StockMovementType.ISSUE);
            testMovement.setSourceLocationId(sourceLocationId);
            testMovement.setDestinationLocationId(null);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            StockMovementLine line = StockMovementLine.builder()
                    .movementId(movementId)
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .quantity(new BigDecimal("999.000"))
                    .build();
            line.setId(UUID.randomUUID());

            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of(line));

            // Stock has only 500 available
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, sourceLocationId))
                    .thenReturn(Optional.of(testStockEntry));

            assertThatThrownBy(() -> movementService.confirmMovement(movementId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Недостаточно материала");
        }
    }

    @Nested
    @DisplayName("Execute Movement")
    class ExecuteMovementTests {

        @Test
        @DisplayName("Should execute a CONFIRMED receipt and update stock")
        void executeMovement_Receipt_UpdatesStock() {
            testMovement.setStatus(StockMovementStatus.CONFIRMED);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            StockMovementLine line = StockMovementLine.builder()
                    .movementId(movementId)
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .quantity(new BigDecimal("200.000"))
                    .unitPrice(new BigDecimal("16.00"))
                    .build();
            line.setId(UUID.randomUUID());

            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of(line));

            // No existing stock entry, should create new
            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, destinationLocationId))
                    .thenReturn(Optional.empty());
            when(stockEntryRepository.save(any(StockEntry.class))).thenAnswer(invocation -> {
                StockEntry entry = invocation.getArgument(0);
                if (entry.getId() == null) {
                    entry.setId(UUID.randomUUID());
                    entry.setCreatedAt(Instant.now());
                }
                return entry;
            });
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

            StockMovementResponse response = movementService.executeMovement(movementId);

            assertThat(response.status()).isEqualTo(StockMovementStatus.DONE);
            verify(auditService).logStatusChange("StockMovement", movementId, "CONFIRMED", "DONE");
            // Verify stock was saved (new entry created + then updated with add)
            verify(stockEntryRepository, org.mockito.Mockito.atLeast(1)).save(any(StockEntry.class));
        }
    }

    @Nested
    @DisplayName("Cancel Movement")
    class CancelMovementTests {

        @Test
        @DisplayName("Should cancel a DRAFT movement")
        void cancelMovement_Draft() {
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));
            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of());

            StockMovementResponse response = movementService.cancelMovement(movementId);

            assertThat(response.status()).isEqualTo(StockMovementStatus.CANCELLED);
            verify(auditService).logStatusChange("StockMovement", movementId, "DRAFT", "CANCELLED");
        }

        @Test
        @DisplayName("Should cancel a DONE receipt movement and reverse stock")
        void cancelMovement_Done_ReversesStock() {
            testMovement.setStatus(StockMovementStatus.DONE);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            StockMovementLine line = StockMovementLine.builder()
                    .movementId(movementId)
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .quantity(new BigDecimal("200.000"))
                    .unitPrice(new BigDecimal("16.00"))
                    .build();
            line.setId(UUID.randomUUID());

            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of(line));

            // Existing stock entry at destination (receipt was already applied)
            StockEntry destEntry = StockEntry.builder()
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .locationId(destinationLocationId)
                    .quantity(new BigDecimal("200.000"))
                    .reservedQuantity(BigDecimal.ZERO)
                    .availableQuantity(new BigDecimal("200.000"))
                    .build();
            destEntry.setId(UUID.randomUUID());

            when(stockEntryRepository.findByMaterialIdAndLocationIdAndDeletedFalse(materialId, destinationLocationId))
                    .thenReturn(Optional.of(destEntry));
            when(stockEntryRepository.save(any(StockEntry.class))).thenAnswer(inv -> inv.getArgument(0));
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

            StockMovementResponse response = movementService.cancelMovement(movementId);

            assertThat(response.status()).isEqualTo(StockMovementStatus.CANCELLED);
            // The destEntry should have quantity subtracted back to 0
            assertThat(destEntry.getQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logStatusChange("StockMovement", movementId, "DONE", "CANCELLED");
        }

        @Test
        @DisplayName("Should reject cancelling an already cancelled movement")
        void cancelMovement_AlreadyCancelled() {
            testMovement.setStatus(StockMovementStatus.CANCELLED);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            assertThatThrownBy(() -> movementService.cancelMovement(movementId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отменить движение");
        }
    }

    @Nested
    @DisplayName("Low Stock Alerts")
    class LowStockAlertTests {

        @Mock
        private StockEntryRepository alertStockEntryRepository;

        @Mock
        private MaterialRepository alertMaterialRepository;

        @Test
        @DisplayName("Should return alerts for materials below minimum stock level")
        void getLowStockAlerts_ReturnsList() {
            StockEntry lowEntry = StockEntry.builder()
                    .materialId(materialId)
                    .materialName("Цемент М500")
                    .locationId(sourceLocationId)
                    .quantity(new BigDecimal("50.000"))
                    .reservedQuantity(BigDecimal.ZERO)
                    .availableQuantity(new BigDecimal("50.000"))
                    .build();
            lowEntry.setId(UUID.randomUUID());

            when(stockEntryRepository.findLowStockEntries()).thenReturn(List.of(lowEntry));
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(testMaterial));

            // Use the actual StockService for this test
            StockService stockService = new StockService(stockEntryRepository, materialRepository);
            List<LowStockAlertResponse> alerts = stockService.getLowStockAlerts();

            assertThat(alerts).hasSize(1);
            assertThat(alerts.get(0).materialName()).isEqualTo("Цемент М500");
            assertThat(alerts.get(0).currentQuantity()).isEqualByComparingTo(new BigDecimal("50.000"));
            assertThat(alerts.get(0).minStockLevel()).isEqualByComparingTo(new BigDecimal("100.000"));
            assertThat(alerts.get(0).deficit()).isEqualByComparingTo(new BigDecimal("50.000"));
        }
    }

    @Test
    @DisplayName("Should throw when movement not found")
    void getMovement_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(movementRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movementService.getMovement(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Движение не найдено");
    }
}
