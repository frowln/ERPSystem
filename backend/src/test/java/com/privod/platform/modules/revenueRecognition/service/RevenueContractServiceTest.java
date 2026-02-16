package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.RevenueContractRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueContractRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueContractResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.UpdateRevenueContractRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueContractServiceTest {

    @Mock
    private RevenueContractRepository revenueContractRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevenueContractService revenueContractService;

    private UUID contractId;
    private RevenueContract testContract;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        testContract = RevenueContract.builder()
                .projectId(UUID.randomUUID())
                .contractId(UUID.randomUUID())
                .contractName("Construction Contract")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000"))
                .totalEstimatedCost(new BigDecimal("8000000"))
                .organizationId(UUID.randomUUID())
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2027, 12, 31))
                .build();
        testContract.setId(contractId);
        testContract.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Revenue Contract")
    class CreateTests {

        @Test
        @DisplayName("Should create contract with default recognition method and standard")
        void shouldCreateContract_withDefaults() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    UUID.randomUUID(), UUID.randomUUID(), "New Contract",
                    null, null,
                    new BigDecimal("5000000"), new BigDecimal("4000000"),
                    UUID.randomUUID(), LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31));

            when(revenueContractRepository.save(any(RevenueContract.class))).thenAnswer(inv -> {
                RevenueContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            RevenueContractResponse response = revenueContractService.createContract(request);

            assertThat(response).isNotNull();
            assertThat(response.recognitionMethod()).isEqualTo(RecognitionMethod.PERCENTAGE_OF_COMPLETION);
            assertThat(response.recognitionStandard()).isEqualTo(RecognitionStandard.PBU_2_2008);
            verify(auditService).logCreate(eq("RevenueContract"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create contract with explicit method and standard")
        void shouldCreateContract_withExplicitValues() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    UUID.randomUUID(), UUID.randomUUID(), "IFRS Contract",
                    RecognitionMethod.INPUT_METHOD, RecognitionStandard.FSBU_9_2025,
                    new BigDecimal("5000000"), new BigDecimal("4000000"),
                    UUID.randomUUID(), null, null);

            when(revenueContractRepository.save(any(RevenueContract.class))).thenAnswer(inv -> {
                RevenueContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            RevenueContractResponse response = revenueContractService.createContract(request);

            assertThat(response.recognitionMethod()).isEqualTo(RecognitionMethod.INPUT_METHOD);
            assertThat(response.recognitionStandard()).isEqualTo(RecognitionStandard.FSBU_9_2025);
        }

        @Test
        @DisplayName("Should reject when end date is before start date")
        void shouldThrowException_whenEndDateBeforeStartDate() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    UUID.randomUUID(), null, "Bad Dates Contract",
                    null, null,
                    new BigDecimal("1000000"), new BigDecimal("800000"),
                    UUID.randomUUID(),
                    LocalDate.of(2026, 12, 31), LocalDate.of(2025, 1, 1));

            assertThatThrownBy(() -> revenueContractService.createContract(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("позже");
        }
    }

    @Nested
    @DisplayName("Read Revenue Contract")
    class ReadTests {

        @Test
        @DisplayName("Should get contract by ID")
        void shouldReturnContract_whenFound() {
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            RevenueContractResponse response = revenueContractService.getContract(contractId);

            assertThat(response).isNotNull();
            assertThat(response.contractName()).isEqualTo("Construction Contract");
            assertThat(response.lossContract()).isFalse();
            assertThat(response.expectedProfit()).isEqualByComparingTo("2000000");
        }

        @Test
        @DisplayName("Should throw when contract not found")
        void shouldThrowException_whenContractNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(revenueContractRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> revenueContractService.getContract(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should detect loss contract correctly")
        void shouldDetectLossContract() {
            testContract.setTotalEstimatedCost(new BigDecimal("12000000"));
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            RevenueContractResponse response = revenueContractService.getContract(contractId);

            assertThat(response.lossContract()).isTrue();
            assertThat(response.expectedLoss()).isEqualByComparingTo("2000000");
        }
    }

    @Nested
    @DisplayName("Update Revenue Contract")
    class UpdateTests {

        @Test
        @DisplayName("Should update contract fields selectively")
        void shouldUpdateContract_whenValidFields() {
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(revenueContractRepository.save(any(RevenueContract.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UpdateRevenueContractRequest request = new UpdateRevenueContractRequest(
                    null, "Updated Contract Name", null, null,
                    new BigDecimal("12000000"), null, null, null, false);

            RevenueContractResponse response = revenueContractService.updateContract(contractId, request);

            assertThat(response.contractName()).isEqualTo("Updated Contract Name");
            assertThat(response.totalContractRevenue()).isEqualByComparingTo("12000000");
            verify(auditService).logUpdate(eq("RevenueContract"), eq(contractId), eq("multiple"), any(), any());
        }

        @Test
        @DisplayName("Should reject update with invalid dates")
        void shouldThrowException_whenUpdateInvalidDates() {
            testContract.setEndDate(LocalDate.of(2024, 1, 1));
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            UpdateRevenueContractRequest request = new UpdateRevenueContractRequest(
                    null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> revenueContractService.updateContract(contractId, request))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Delete Revenue Contract")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete contract")
        void shouldSoftDeleteContract() {
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(revenueContractRepository.save(any(RevenueContract.class))).thenReturn(testContract);

            revenueContractService.deleteContract(contractId);

            assertThat(testContract.isDeleted()).isTrue();
            verify(auditService).logDelete("RevenueContract", contractId);
        }
    }
}
