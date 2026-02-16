package com.privod.platform.modules.revenueRecognition;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.CompletionPercentage;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.CompletionPercentageRepository;
import com.privod.platform.modules.revenueRecognition.service.CompletionPercentageService;
import com.privod.platform.modules.revenueRecognition.service.RevenueContractService;
import com.privod.platform.modules.revenueRecognition.web.dto.CompletionPercentageResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateCompletionPercentageRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class CompletionPercentageServiceTest {

    @Mock
    private CompletionPercentageRepository completionPercentageRepository;

    @Mock
    private RevenueContractService revenueContractService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CompletionPercentageService completionPercentageService;

    private UUID revenueContractId;
    private RevenueContract testContract;

    @BeforeEach
    void setUp() {
        revenueContractId = UUID.randomUUID();

        testContract = RevenueContract.builder()
                .projectId(UUID.randomUUID())
                .contractName("Договор КС-2025")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000.00"))
                .totalEstimatedCost(new BigDecimal("8000000.00"))
                .organizationId(UUID.randomUUID())
                .build();
        testContract.setId(revenueContractId);
        testContract.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should calculate percent complete from cumulative cost and estimated cost")
    void create_CalculatesPercentComplete() {
        when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
        when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
            CompletionPercentage cp = inv.getArgument(0);
            cp.setId(UUID.randomUUID());
            cp.setCreatedAt(Instant.now());
            return cp;
        });

        // 4,000,000 / 8,000,000 * 100 = 50%
        CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                revenueContractId, LocalDate.of(2025, 6, 30),
                null, new BigDecimal("4000000.00"), null,
                null, "Расчёт на конец Q2", UUID.randomUUID());

        CompletionPercentageResponse response = completionPercentageService.create(request);

        assertThat(response.percentComplete()).isEqualByComparingTo(new BigDecimal("50.0000"));
        assertThat(response.method()).isEqualTo(RecognitionMethod.PERCENTAGE_OF_COMPLETION);
        verify(auditService).logCreate(eq("CompletionPercentage"), any(UUID.class));
    }

    @Test
    @DisplayName("Should use physical percent override when provided")
    void create_PhysicalPercentOverride() {
        when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
        when(completionPercentageRepository.save(any(CompletionPercentage.class))).thenAnswer(inv -> {
            CompletionPercentage cp = inv.getArgument(0);
            cp.setId(UUID.randomUUID());
            cp.setCreatedAt(Instant.now());
            return cp;
        });

        // Physical override = 65% (regardless of cost ratio)
        CreateCompletionPercentageRequest request = new CreateCompletionPercentageRequest(
                revenueContractId, LocalDate.of(2025, 6, 30),
                RecognitionMethod.OUTPUT_METHOD, new BigDecimal("4000000.00"), null,
                new BigDecimal("65.0000"), "Физический осмотр", UUID.randomUUID());

        CompletionPercentageResponse response = completionPercentageService.create(request);

        assertThat(response.percentComplete()).isEqualByComparingTo(new BigDecimal("65.0000"));
        assertThat(response.physicalPercentComplete()).isEqualByComparingTo(new BigDecimal("65.0000"));
    }

    @Test
    @DisplayName("Should throw when getting latest for non-existent contract records")
    void getLatest_NoRecords() {
        when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
        when(completionPercentageRepository.findLatestByContract(revenueContractId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> completionPercentageService.getLatest(revenueContractId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Нет записей процента завершения для договора");
    }
}
