package com.privod.platform.modules.contractExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ClaimStatus;
import com.privod.platform.modules.contractExt.domain.ClaimType;
import com.privod.platform.modules.contractExt.domain.ContractClaim;
import com.privod.platform.modules.contractExt.repository.ContractClaimRepository;
import com.privod.platform.modules.contractExt.service.ContractClaimService;
import com.privod.platform.modules.contractExt.web.dto.ContractClaimResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateClaimRequest;
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
class ContractClaimServiceTest {

    @Mock
    private ContractClaimRepository claimRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ContractClaimService claimService;

    private UUID contractId;
    private UUID claimId;
    private ContractClaim testClaim;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        claimId = UUID.randomUUID();

        testClaim = ContractClaim.builder()
                .contractId(contractId)
                .code("CLM-00001")
                .claimType(ClaimType.DEFECT)
                .subject("Дефект бетонных конструкций")
                .description("Обнаружены трещины в фундаменте секции 3")
                .amount(new BigDecimal("250000.00"))
                .evidenceUrls(List.of("https://storage.example.com/photo1.jpg"))
                .filedById(UUID.randomUUID())
                .filedAt(Instant.now())
                .status(ClaimStatus.FILED)
                .build();
        testClaim.setId(claimId);
        testClaim.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Claim")
    class CreateClaimTests {

        @Test
        @DisplayName("Should create claim with auto-generated code and FILED status")
        void createClaim_SetsCodeAndFiledStatus() {
            CreateClaimRequest request = new CreateClaimRequest(
                    contractId, ClaimType.DELAY, "Нарушение сроков",
                    "Задержка поставки материалов на 14 дней",
                    new BigDecimal("100000.00"), List.of(), UUID.randomUUID());

            when(claimRepository.getNextClaimCodeSequence()).thenReturn(42L);
            when(claimRepository.save(any(ContractClaim.class))).thenAnswer(inv -> {
                ContractClaim c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ContractClaimResponse response = claimService.create(request);

            assertThat(response.code()).isEqualTo("CLM-00042");
            assertThat(response.status()).isEqualTo(ClaimStatus.FILED);
            assertThat(response.claimType()).isEqualTo(ClaimType.DELAY);
            verify(auditService).logCreate(eq("ContractClaim"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should transition FILED -> UNDER_REVIEW")
        void changeStatus_FiledToUnderReview() {
            when(claimRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(claimRepository.save(any(ContractClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractClaimResponse response = claimService.changeStatus(
                    claimId, ClaimStatus.UNDER_REVIEW, null);

            assertThat(response.status()).isEqualTo(ClaimStatus.UNDER_REVIEW);
            assertThat(response.respondedAt()).isNotNull();
            verify(auditService).logStatusChange("ContractClaim", claimId, "FILED", "UNDER_REVIEW");
        }

        @Test
        @DisplayName("Should transition FILED -> ACCEPTED with response text")
        void changeStatus_FiledToAccepted() {
            when(claimRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(claimRepository.save(any(ContractClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractClaimResponse response = claimService.changeStatus(
                    claimId, ClaimStatus.ACCEPTED, "Претензия обоснована");

            assertThat(response.status()).isEqualTo(ClaimStatus.ACCEPTED);
            assertThat(response.responseText()).isEqualTo("Претензия обоснована");
        }

        @Test
        @DisplayName("Should reject invalid transition REJECTED -> ACCEPTED")
        void changeStatus_InvalidTransition() {
            testClaim.setStatus(ClaimStatus.REJECTED);
            when(claimRepository.findById(claimId)).thenReturn(Optional.of(testClaim));

            assertThatThrownBy(() -> claimService.changeStatus(claimId, ClaimStatus.ACCEPTED, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести претензию");
        }

        @Test
        @DisplayName("Should transition ACCEPTED -> RESOLVED with resolution notes")
        void changeStatus_AcceptedToResolved() {
            testClaim.setStatus(ClaimStatus.ACCEPTED);
            when(claimRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(claimRepository.save(any(ContractClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractClaimResponse response = claimService.changeStatus(
                    claimId, ClaimStatus.RESOLVED, "Устранены дефекты, проведена экспертиза");

            assertThat(response.status()).isEqualTo(ClaimStatus.RESOLVED);
            assertThat(response.resolvedAt()).isNotNull();
            assertThat(response.resolutionNotes()).isEqualTo("Устранены дефекты, проведена экспертиза");
        }
    }

    @Test
    @DisplayName("Should find claim by ID")
    void getById_Success() {
        when(claimRepository.findById(claimId)).thenReturn(Optional.of(testClaim));

        ContractClaimResponse response = claimService.getById(claimId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("CLM-00001");
        assertThat(response.claimTypeDisplayName()).isEqualTo("Дефект");
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("250000.00"));
    }

    @Test
    @DisplayName("Should throw when claim not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(claimRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> claimService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Претензия не найдена");
    }
}
