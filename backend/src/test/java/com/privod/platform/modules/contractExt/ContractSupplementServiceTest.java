package com.privod.platform.modules.contractExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ContractSupplement;
import com.privod.platform.modules.contractExt.domain.SupplementStatus;
import com.privod.platform.modules.contractExt.repository.ContractSupplementRepository;
import com.privod.platform.modules.contractExt.service.ContractSupplementService;
import com.privod.platform.modules.contractExt.web.dto.ContractSupplementResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSupplementRequest;
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
class ContractSupplementServiceTest {

    @Mock
    private ContractSupplementRepository supplementRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ContractSupplementService supplementService;

    private UUID contractId;
    private UUID supplementId;
    private ContractSupplement testSupplement;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        supplementId = UUID.randomUUID();

        testSupplement = ContractSupplement.builder()
                .contractId(contractId)
                .number("ДС-001")
                .supplementDate(LocalDate.of(2025, 6, 1))
                .reason("Изменение объёма работ")
                .description("Увеличение объёма бетонных работ на 15%")
                .amountChange(new BigDecimal("500000.00"))
                .newTotalAmount(new BigDecimal("5500000.00"))
                .status(SupplementStatus.DRAFT)
                .signatories(List.of("Иванов И.И.", "Петров П.П."))
                .build();
        testSupplement.setId(supplementId);
        testSupplement.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Supplement")
    class CreateSupplementTests {

        @Test
        @DisplayName("Should create supplement with DRAFT status")
        void createSupplement_SetsDefaultDraftStatus() {
            CreateSupplementRequest request = new CreateSupplementRequest(
                    contractId, "ДС-002", LocalDate.of(2025, 7, 1),
                    "Корректировка сроков", "Продление на 30 дней",
                    new BigDecimal("0"), null, 30,
                    LocalDate.of(2026, 1, 31), List.of("Сидоров С.С."));

            when(supplementRepository.save(any(ContractSupplement.class))).thenAnswer(inv -> {
                ContractSupplement s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            ContractSupplementResponse response = supplementService.create(request);

            assertThat(response.status()).isEqualTo(SupplementStatus.DRAFT);
            assertThat(response.number()).isEqualTo("ДС-002");
            assertThat(response.deadlineChange()).isEqualTo(30);
            verify(auditService).logCreate(eq("ContractSupplement"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Approve Supplement")
    class ApproveSupplementTests {

        @Test
        @DisplayName("Should approve DRAFT supplement")
        void approveSupplement_DraftToApproved() {
            when(supplementRepository.findById(supplementId)).thenReturn(Optional.of(testSupplement));
            when(supplementRepository.save(any(ContractSupplement.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractSupplementResponse response = supplementService.approve(supplementId);

            assertThat(response.status()).isEqualTo(SupplementStatus.APPROVED);
            verify(auditService).logStatusChange("ContractSupplement", supplementId, "DRAFT", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approve when supplement is already SIGNED")
        void approveSupplement_AlreadySigned() {
            testSupplement.setStatus(SupplementStatus.SIGNED);
            when(supplementRepository.findById(supplementId)).thenReturn(Optional.of(testSupplement));

            assertThatThrownBy(() -> supplementService.approve(supplementId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Согласовать можно только ДС в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("Sign Supplement")
    class SignSupplementTests {

        @Test
        @DisplayName("Should sign APPROVED supplement and set signedAt")
        void signSupplement_SetsSignedAtAndStatus() {
            testSupplement.setStatus(SupplementStatus.APPROVED);
            when(supplementRepository.findById(supplementId)).thenReturn(Optional.of(testSupplement));
            when(supplementRepository.save(any(ContractSupplement.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractSupplementResponse response = supplementService.sign(supplementId);

            assertThat(response.status()).isEqualTo(SupplementStatus.SIGNED);
            assertThat(response.signedAt()).isNotNull();
            verify(auditService).logStatusChange("ContractSupplement", supplementId, "APPROVED", "SIGNED");
        }

        @Test
        @DisplayName("Should reject sign when supplement is DRAFT")
        void signSupplement_DraftNotAllowed() {
            when(supplementRepository.findById(supplementId)).thenReturn(Optional.of(testSupplement));

            assertThatThrownBy(() -> supplementService.sign(supplementId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Подписать можно только согласованное ДС");
        }
    }

    @Test
    @DisplayName("Should find supplement by ID")
    void getById_Success() {
        when(supplementRepository.findById(supplementId)).thenReturn(Optional.of(testSupplement));

        ContractSupplementResponse response = supplementService.getById(supplementId);

        assertThat(response).isNotNull();
        assertThat(response.number()).isEqualTo("ДС-001");
        assertThat(response.amountChange()).isEqualByComparingTo(new BigDecimal("500000.00"));
    }

    @Test
    @DisplayName("Should throw when supplement not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(supplementRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> supplementService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Дополнительное соглашение не найдено");
    }
}
