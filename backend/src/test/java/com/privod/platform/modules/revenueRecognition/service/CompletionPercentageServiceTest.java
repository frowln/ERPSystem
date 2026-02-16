package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.CompletionPercentage;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.CompletionPercentageRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CompletionPercentageResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateCompletionPercentageRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class CompletionPercentageServiceTest {

    @Mock
    private CompletionPercentageRepository completionPercentageRepository;

    @Mock
    private RevenueContractService revenueContractService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CompletionPercentageService completionPercentageService;

    private UUID contractId;
    private UUID cpId;
    private RevenueContract testContract;
    private CompletionPercentage testCp;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        cpId = UUID.randomUUID();

        testContract = RevenueContract.builder()
                .projectId(UUID.randomUUID())
                .contractName("Contract")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000"))
                .totalEstimatedCost(new BigDecimal("8000000"))
                .organizationId(UUID.randomUUID())
                .build();
        testContract.setId(contractId);

        testCp = CompletionPercentage.builder()
                .revenueContractId(contractId)
                .calculationDate(LocalDate.of(2025, 6, 30))
                .method(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .cumulativeCostIncurred(new BigDecimal("4000000"))
                .totalEstimatedCost(new BigDecimal("8000000"))
                .percentComplete(new BigDecimal("50.0000"))
                .build();
        testCp.setId(cpId);
        testCp.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Completion Percentage")
    class CreateTests {

        @Test
        @DisplayName("Should calculate percent complete from cost data")
        void shouldCalculatePercentComplete_fromCost() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                    contractId, LocalDate.of(2025, 6, 30), null,
                    new BigDecimal("2400000"), null, null,
                    "Q2 calculation", UUID.randomUUID());

            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
                CompletionPercentage cp = inv.getArgument(0);
                cp.setId(UUID.randomUUID());
                cp.setCreatedAt(Instant.now());
                return cp;
            });

            CompletionPercentageResponse response = completionPercentageService.create(request);

            assertThat(response).isNotNull();
            // percentComplete = 2400000 / 8000000 * 100 = 30.0000
            assertThat(response.percentComplete()).isEqualByComparingTo("30.0000");
            verify(auditService).logCreate(eq("CompletionPercentage"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use physical percent override when provided")
        void shouldUsePhysicalPercentOverride() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                    contractId, LocalDate.of(2025, 6, 30), null,
                    new BigDecimal("2400000"), null,
                    new BigDecimal("35.0000"),
                    "Manual override", UUID.randomUUID());

            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
                CompletionPercentage cp = inv.getArgument(0);
                cp.setId(UUID.randomUUID());
                cp.setCreatedAt(Instant.now());
                return cp;
            });

            CompletionPercentageResponse response = completionPercentageService.create(request);

            assertThat(response.percentComplete()).isEqualByComparingTo("35.0000");
        }

        @Test
        @DisplayName("Should cap percent complete at 100%")
        void shouldCapPercentComplete_at100() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            // Cost exceeds estimated cost
            CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                    contractId, LocalDate.of(2025, 12, 31), null,
                    new BigDecimal("9000000"), null, null,
                    null, null);

            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
                CompletionPercentage cp = inv.getArgument(0);
                cp.setId(UUID.randomUUID());
                cp.setCreatedAt(Instant.now());
                return cp;
            });

            CompletionPercentageResponse response = completionPercentageService.create(request);

            assertThat(response.percentComplete()).isEqualByComparingTo("100.0000");
        }

        @Test
        @DisplayName("Should return zero percent when no cost data provided")
        void shouldReturnZeroPercent_whenNoCostData() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                    contractId, LocalDate.of(2025, 1, 1), null,
                    null, null, null, null, null);

            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
                CompletionPercentage cp = inv.getArgument(0);
                cp.setId(UUID.randomUUID());
                cp.setCreatedAt(Instant.now());
                return cp;
            });

            CompletionPercentageResponse response = completionPercentageService.create(request);

            assertThat(response.percentComplete()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should use provided total estimated cost over contract value")
        void shouldUseProvidedTotalEstimatedCost() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                    contractId, LocalDate.of(2025, 6, 30), null,
                    new BigDecimal("4000000"), new BigDecimal("10000000"),
                    null, null, null);

            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
                CompletionPercentage cp = inv.getArgument(0);
                cp.setId(UUID.randomUUID());
                cp.setCreatedAt(Instant.now());
                return cp;
            });

            CompletionPercentageResponse response = completionPercentageService.create(request);

            // Uses provided totalEstimatedCost: 4000000 / 10000000 * 100 = 40.0000
            assertThat(response.percentComplete()).isEqualByComparingTo("40.0000");
        }
    }

    @Nested
    @DisplayName("Read Completion Percentage")
    class ReadTests {

        @Test
        @DisplayName("Should get by ID")
        void shouldReturnCp_whenFound() {
            when(completionPercentageRepository.findById(cpId)).thenReturn(Optional.of(testCp));

            CompletionPercentageResponse response = completionPercentageService.getById(cpId);

            assertThat(response).isNotNull();
            assertThat(response.percentComplete()).isEqualByComparingTo("50.0000");
        }

        @Test
        @DisplayName("Should throw when not found")
        void shouldThrowException_whenNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(completionPercentageRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> completionPercentageService.getById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should get latest for contract")
        void shouldReturnLatest_forContract() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(completionPercentageRepository.findLatestByContract(contractId))
                    .thenReturn(Optional.of(testCp));

            CompletionPercentageResponse response = completionPercentageService.getLatest(contractId);

            assertThat(response).isNotNull();
            assertThat(response.percentComplete()).isEqualByComparingTo("50.0000");
        }

        @Test
        @DisplayName("Should throw when no records for contract")
        void shouldThrowException_whenNoRecords() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(completionPercentageRepository.findLatestByContract(contractId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> completionPercentageService.getLatest(contractId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return paginated list by contract")
        void shouldReturnPagedList_byContract() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<CompletionPercentage> page = new PageImpl<>(List.of(testCp));
            when(completionPercentageRepository
                    .findByRevenueContractIdAndDeletedFalseOrderByCalculationDateDesc(contractId, pageable))
                    .thenReturn(page);

            Page<CompletionPercentageResponse> result =
                    completionPercentageService.listByContract(contractId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Delete Completion Percentage")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete completion percentage")
        void shouldSoftDelete() {
            when(completionPercentageRepository.findById(cpId)).thenReturn(Optional.of(testCp));
            when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenReturn(testCp);

            completionPercentageService.delete(cpId);

            assertThat(testCp.isDeleted()).isTrue();
            verify(auditService).logDelete("CompletionPercentage", cpId);
        }
    }
}
