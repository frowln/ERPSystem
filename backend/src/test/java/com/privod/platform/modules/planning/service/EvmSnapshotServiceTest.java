package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.web.dto.CreateEvmSnapshotRequest;
import com.privod.platform.modules.planning.web.dto.EvmSnapshotResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class EvmSnapshotServiceTest {

    @Mock
    private EvmSnapshotRepository evmSnapshotRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EvmSnapshotService evmSnapshotService;

    private UUID snapshotId;
    private UUID projectId;
    private EvmSnapshot testSnapshot;

    @BeforeEach
    void setUp() {
        snapshotId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testSnapshot = EvmSnapshot.builder()
                .projectId(projectId)
                .snapshotDate(LocalDate.of(2025, 6, 30))
                .dataDate(LocalDate.of(2025, 6, 30))
                .budgetAtCompletion(new BigDecimal("10000000"))
                .plannedValue(new BigDecimal("5000000"))
                .earnedValue(new BigDecimal("4500000"))
                .actualCost(new BigDecimal("5200000"))
                .percentComplete(new BigDecimal("45"))
                .criticalPathLength(180)
                .build();
        testSnapshot.setId(snapshotId);
        testSnapshot.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("EVM Metric Calculations")
    class EvmCalculationTests {

        @Test
        @DisplayName("Should calculate CPI correctly (EV/AC)")
        void shouldCalculateCpi() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("4500000"))
                    .actualCost(new BigDecimal("5200000"))
                    .plannedValue(new BigDecimal("5000000"))
                    .budgetAtCompletion(new BigDecimal("10000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            // CPI = 4500000 / 5200000 = 0.8654
            assertThat(snapshot.getCpi()).isEqualByComparingTo("0.8654");
        }

        @Test
        @DisplayName("Should calculate SPI correctly (EV/PV)")
        void shouldCalculateSpi() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("4500000"))
                    .actualCost(new BigDecimal("5200000"))
                    .plannedValue(new BigDecimal("5000000"))
                    .budgetAtCompletion(new BigDecimal("10000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            // SPI = 4500000 / 5000000 = 0.9000
            assertThat(snapshot.getSpi()).isEqualByComparingTo("0.9000");
        }

        @Test
        @DisplayName("Should calculate EAC correctly (BAC/CPI)")
        void shouldCalculateEac() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("4500000"))
                    .actualCost(new BigDecimal("5200000"))
                    .plannedValue(new BigDecimal("5000000"))
                    .budgetAtCompletion(new BigDecimal("10000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            // CPI = 0.8654, EAC = 10000000 / 0.8654 = 11555304.60 (approx)
            assertThat(snapshot.getEac()).isNotNull();
            assertThat(snapshot.getEac().compareTo(new BigDecimal("11000000"))).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should calculate ETC correctly (EAC - AC)")
        void shouldCalculateEtc() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("4500000"))
                    .actualCost(new BigDecimal("5200000"))
                    .plannedValue(new BigDecimal("5000000"))
                    .budgetAtCompletion(new BigDecimal("10000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            assertThat(snapshot.getEtcValue()).isNotNull();
            // ETC = EAC - AC, should be positive
            assertThat(snapshot.getEtcValue().compareTo(BigDecimal.ZERO)).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should calculate TCPI correctly")
        void shouldCalculateTcpi() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("4500000"))
                    .actualCost(new BigDecimal("5200000"))
                    .plannedValue(new BigDecimal("5000000"))
                    .budgetAtCompletion(new BigDecimal("10000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            // TCPI = (BAC - EV) / (BAC - AC) = (10000000 - 4500000) / (10000000 - 5200000)
            // = 5500000 / 4800000 = 1.1458
            assertThat(snapshot.getTcpi()).isEqualByComparingTo("1.1458");
        }

        @Test
        @DisplayName("Should handle null values gracefully in EVM calculations")
        void shouldHandleNullValues() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(null)
                    .actualCost(null)
                    .plannedValue(null)
                    .budgetAtCompletion(null)
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            assertThat(snapshot.getCpi()).isNull();
            assertThat(snapshot.getSpi()).isNull();
            assertThat(snapshot.getEac()).isNull();
        }

        @Test
        @DisplayName("Should handle zero actual cost in CPI calculation")
        void shouldHandleZeroActualCost() {
            EvmSnapshot snapshot = EvmSnapshot.builder()
                    .earnedValue(new BigDecimal("100000"))
                    .actualCost(BigDecimal.ZERO)
                    .plannedValue(new BigDecimal("200000"))
                    .budgetAtCompletion(new BigDecimal("1000000"))
                    .build();

            evmSnapshotService.calculateEvmMetrics(snapshot);

            // AC is zero, so CPI should not be calculated
            assertThat(snapshot.getCpi()).isNull();
        }
    }

    @Nested
    @DisplayName("Create EVM Snapshot")
    class CreateTests {

        @Test
        @DisplayName("Should create snapshot and calculate metrics")
        void shouldCreateSnapshot_withCalculatedMetrics() {
            CreateEvmSnapshotRequest request = new CreateEvmSnapshotRequest(
                    projectId, LocalDate.of(2025, 6, 30), LocalDate.of(2025, 6, 30),
                    new BigDecimal("10000000"), new BigDecimal("5000000"),
                    new BigDecimal("4500000"), new BigDecimal("5200000"),
                    new BigDecimal("45"), 180, "Monthly EVM snapshot");

            when(evmSnapshotRepository.save(any(EvmSnapshot.class))).thenAnswer(inv -> {
                EvmSnapshot s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            EvmSnapshotResponse response = evmSnapshotService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.cpi()).isNotNull();
            assertThat(response.spi()).isNotNull();
            verify(auditService).logCreate(eq("EvmSnapshot"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Read EVM Snapshot")
    class ReadTests {

        @Test
        @DisplayName("Should find snapshot by ID")
        void shouldReturnSnapshot_whenFound() {
            when(evmSnapshotRepository.findById(snapshotId)).thenReturn(Optional.of(testSnapshot));

            EvmSnapshotResponse response = evmSnapshotService.findById(snapshotId);

            assertThat(response).isNotNull();
            assertThat(response.projectId()).isEqualTo(projectId);
        }

        @Test
        @DisplayName("Should throw when snapshot not found")
        void shouldThrowException_whenSnapshotNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(evmSnapshotRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> evmSnapshotService.findById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return latest snapshot for project")
        void shouldReturnLatestSnapshot() {
            when(evmSnapshotRepository.findLatestByProjectId(projectId))
                    .thenReturn(Optional.of(testSnapshot));

            Optional<EvmSnapshotResponse> result = evmSnapshotService.findLatest(projectId);

            assertThat(result).isPresent();
            assertThat(result.get().snapshotDate()).isEqualTo(LocalDate.of(2025, 6, 30));
        }

        @Test
        @DisplayName("Should return empty optional when no latest snapshot")
        void shouldReturnEmpty_whenNoLatestSnapshot() {
            when(evmSnapshotRepository.findLatestByProjectId(projectId))
                    .thenReturn(Optional.empty());

            Optional<EvmSnapshotResponse> result = evmSnapshotService.findLatest(projectId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return snapshots by date range")
        void shouldReturnSnapshots_byDateRange() {
            LocalDate from = LocalDate.of(2025, 1, 1);
            LocalDate to = LocalDate.of(2025, 12, 31);
            when(evmSnapshotRepository
                    .findByProjectIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDate(projectId, from, to))
                    .thenReturn(List.of(testSnapshot));

            List<EvmSnapshotResponse> result = evmSnapshotService.findByDateRange(projectId, from, to);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Delete EVM Snapshot")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete snapshot")
        void shouldSoftDeleteSnapshot() {
            when(evmSnapshotRepository.findById(snapshotId)).thenReturn(Optional.of(testSnapshot));
            when(evmSnapshotRepository.save(any(EvmSnapshot.class))).thenReturn(testSnapshot);

            evmSnapshotService.delete(snapshotId);

            assertThat(testSnapshot.isDeleted()).isTrue();
            verify(auditService).logDelete("EvmSnapshot", snapshotId);
        }
    }
}
