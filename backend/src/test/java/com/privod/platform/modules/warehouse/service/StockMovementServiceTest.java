package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementLineRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementLineRequest;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementRequest;
import com.privod.platform.modules.warehouse.web.dto.StockMovementResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockMovementRequest;
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
    private StockMovementService stockMovementService;

    private UUID movementId;
    private UUID projectId;
    private UUID sourceLocationId;
    private UUID destinationLocationId;
    private StockMovement testMovement;

    @BeforeEach
    void setUp() {
        movementId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        sourceLocationId = UUID.randomUUID();
        destinationLocationId = UUID.randomUUID();

        testMovement = StockMovement.builder()
                .number("MOV-00001")
                .movementDate(LocalDate.now())
                .movementType(StockMovementType.RECEIPT)
                .status(StockMovementStatus.DRAFT)
                .projectId(projectId)
                .destinationLocationId(destinationLocationId)
                .build();
        testMovement.setId(movementId);
        testMovement.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Movement")
    class CreateTests {

        @Test
        @DisplayName("Should create RECEIPT movement with destination")
        void shouldCreateReceipt_withDestination() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.now(), StockMovementType.RECEIPT, projectId,
                    null, destinationLocationId, null, null,
                    null, "Receiver Name", "Receipt notes");

            when(movementRepository.getNextNumberSequence()).thenReturn(2L);
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> {
                StockMovement m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            StockMovementResponse response = stockMovementService.createMovement(request);

            assertThat(response.status()).isEqualTo(StockMovementStatus.DRAFT);
            verify(auditService).logCreate(eq("StockMovement"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject RECEIPT without destination")
        void shouldThrowException_whenReceiptWithoutDestination() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.now(), StockMovementType.RECEIPT, projectId,
                    null, null, null, null,
                    null, null, null);

            assertThatThrownBy(() -> stockMovementService.createMovement(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("склад назначения");
        }

        @Test
        @DisplayName("Should reject ISSUE without source")
        void shouldThrowException_whenIssueWithoutSource() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.now(), StockMovementType.ISSUE, projectId,
                    null, null, null, null,
                    null, null, null);

            assertThatThrownBy(() -> stockMovementService.createMovement(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("склад-источник");
        }

        @Test
        @DisplayName("Should reject TRANSFER without both locations")
        void shouldThrowException_whenTransferWithoutBothLocations() {
            CreateStockMovementRequest request = new CreateStockMovementRequest(
                    LocalDate.now(), StockMovementType.TRANSFER, projectId,
                    sourceLocationId, null, null, null,
                    null, null, null);

            assertThatThrownBy(() -> stockMovementService.createMovement(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("оба склада");
        }
    }

    @Nested
    @DisplayName("Update Movement")
    class UpdateTests {

        @Test
        @DisplayName("Should update movement in DRAFT status")
        void shouldUpdate_whenDraft() {
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
            when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));
            when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                    .thenReturn(List.of());

            UpdateStockMovementRequest request = new UpdateStockMovementRequest(
                    null, null, null, null, null, null,
                    null, null, null, "Updated notes");

            StockMovementResponse response = stockMovementService.updateMovement(movementId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate(eq("StockMovement"), eq(movementId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when not DRAFT")
        void shouldThrowException_whenNotDraft() {
            testMovement.setStatus(StockMovementStatus.CONFIRMED);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            UpdateStockMovementRequest request = new UpdateStockMovementRequest(
                    null, null, null, null, null, null,
                    null, null, null, null);

            assertThatThrownBy(() -> stockMovementService.updateMovement(movementId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Add Line to Movement")
    class AddLineTests {

        @Test
        @DisplayName("Should add line to DRAFT movement")
        void shouldAddLine_whenDraft() {
            UUID materialId = UUID.randomUUID();
            Material material = Material.builder()
                    .name("Cement M400")
                    .unitOfMeasure("ton")
                    .build();
            material.setId(materialId);

            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
            when(materialRepository.findById(materialId)).thenReturn(Optional.of(material));
            when(lineRepository.save(any(StockMovementLine.class))).thenAnswer(inv -> {
                StockMovementLine line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            CreateStockMovementLineRequest request = new CreateStockMovementLineRequest(
                    materialId, null, 1, new BigDecimal("50"),
                    new BigDecimal("5000.00"), null, null);

            stockMovementService.addLine(movementId, request);

            verify(lineRepository).save(any(StockMovementLine.class));
        }

        @Test
        @DisplayName("Should reject adding line when not DRAFT")
        void shouldThrowException_whenNotDraft() {
            testMovement.setStatus(StockMovementStatus.DONE);
            when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));

            CreateStockMovementLineRequest request = new CreateStockMovementLineRequest(
                    UUID.randomUUID(), null, 1, new BigDecimal("10"),
                    new BigDecimal("1000"), null, null);

            assertThatThrownBy(() -> stockMovementService.addLine(movementId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Test
    @DisplayName("Should confirm movement with lines")
    void shouldConfirm_whenDraftWithLines() {
        StockMovementLine line = StockMovementLine.builder()
                .movementId(movementId)
                .materialId(UUID.randomUUID())
                .materialName("Cement")
                .quantity(new BigDecimal("10"))
                .build();
        line.setId(UUID.randomUUID());

        when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
        when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                .thenReturn(List.of(line));
        when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        StockMovementResponse response = stockMovementService.confirmMovement(movementId);

        assertThat(response.status()).isEqualTo(StockMovementStatus.CONFIRMED);
    }

    @Test
    @DisplayName("Should reject confirm without lines")
    void shouldThrowException_whenConfirmWithoutLines() {
        when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
        when(lineRepository.findByMovementIdAndDeletedFalseOrderBySequenceAsc(movementId))
                .thenReturn(List.of());

        assertThatThrownBy(() -> stockMovementService.confirmMovement(movementId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("без строк");
    }

    @Test
    @DisplayName("Should throw when movement not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(movementRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stockMovementService.getMovement(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Движение не найдено");
    }

    @Test
    @DisplayName("Should delete movement only in DRAFT status")
    void shouldDelete_whenDraft() {
        when(movementRepository.findById(movementId)).thenReturn(Optional.of(testMovement));
        when(movementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        stockMovementService.deleteMovement(movementId);

        assertThat(testMovement.isDeleted()).isTrue();
        verify(auditService).logDelete("StockMovement", movementId);
    }
}
