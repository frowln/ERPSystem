package com.privod.platform.modules.contractExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ContractSla;
import com.privod.platform.modules.contractExt.domain.PenaltyType;
import com.privod.platform.modules.contractExt.domain.SlaViolation;
import com.privod.platform.modules.contractExt.domain.ViolationStatus;
import com.privod.platform.modules.contractExt.repository.ContractSlaRepository;
import com.privod.platform.modules.contractExt.repository.SlaViolationRepository;
import com.privod.platform.modules.contractExt.service.ContractSlaService;
import com.privod.platform.modules.contractExt.web.dto.ContractSlaResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaViolationRequest;
import com.privod.platform.modules.contractExt.web.dto.SlaViolationResponse;
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
class ContractSlaServiceTest {

    @Mock
    private ContractSlaRepository slaRepository;

    @Mock
    private SlaViolationRepository violationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ContractSlaService slaService;

    private UUID contractId;
    private UUID slaId;
    private UUID violationId;
    private ContractSla testSla;
    private SlaViolation testViolation;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        slaId = UUID.randomUUID();
        violationId = UUID.randomUUID();

        testSla = ContractSla.builder()
                .contractId(contractId)
                .metric("Время реагирования на инцидент")
                .targetValue(new BigDecimal("24.0000"))
                .unit("часов")
                .measurementPeriod("MONTHLY")
                .penaltyAmount(new BigDecimal("50000.00"))
                .penaltyType(PenaltyType.FIXED)
                .isActive(true)
                .build();
        testSla.setId(slaId);
        testSla.setCreatedAt(Instant.now());

        testViolation = SlaViolation.builder()
                .slaId(slaId)
                .violationDate(LocalDate.of(2025, 6, 15))
                .actualValue(new BigDecimal("48.0000"))
                .penaltyAmount(new BigDecimal("50000.00"))
                .status(ViolationStatus.DETECTED)
                .build();
        testViolation.setId(violationId);
        testViolation.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create SLA with all parameters")
    void createSla_Success() {
        CreateSlaRequest request = new CreateSlaRequest(
                contractId, "Доступность системы", new BigDecimal("99.9000"),
                "%", "MONTHLY", new BigDecimal("10000.00"), PenaltyType.DAILY);

        when(slaRepository.save(any(ContractSla.class))).thenAnswer(inv -> {
            ContractSla s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            s.setCreatedAt(Instant.now());
            return s;
        });

        ContractSlaResponse response = slaService.create(request);

        assertThat(response.metric()).isEqualTo("Доступность системы");
        assertThat(response.isActive()).isTrue();
        assertThat(response.penaltyTypeDisplayName()).isEqualTo("Ежедневная");
        verify(auditService).logCreate(eq("ContractSla"), any(UUID.class));
    }

    @Test
    @DisplayName("Should deactivate SLA")
    void deactivateSla_Success() {
        when(slaRepository.findById(slaId)).thenReturn(Optional.of(testSla));
        when(slaRepository.save(any(ContractSla.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractSlaResponse response = slaService.deactivate(slaId);

        assertThat(response.isActive()).isFalse();
        verify(auditService).logUpdate("ContractSla", slaId, "isActive", "true", "false");
    }

    @Test
    @DisplayName("Should create SLA violation")
    void createViolation_Success() {
        CreateSlaViolationRequest request = new CreateSlaViolationRequest(
                slaId, LocalDate.of(2025, 7, 1),
                new BigDecimal("72.0000"), new BigDecimal("50000.00"));

        when(slaRepository.findById(slaId)).thenReturn(Optional.of(testSla));
        when(violationRepository.save(any(SlaViolation.class))).thenAnswer(inv -> {
            SlaViolation v = inv.getArgument(0);
            v.setId(UUID.randomUUID());
            v.setCreatedAt(Instant.now());
            return v;
        });

        SlaViolationResponse response = slaService.createViolation(request);

        assertThat(response.status()).isEqualTo(ViolationStatus.DETECTED);
        assertThat(response.actualValue()).isEqualByComparingTo(new BigDecimal("72.0000"));
        verify(auditService).logCreate(eq("SlaViolation"), any(UUID.class));
    }

    @Test
    @DisplayName("Should resolve SLA violation")
    void resolveViolation_Success() {
        when(violationRepository.findById(violationId)).thenReturn(Optional.of(testViolation));
        when(violationRepository.save(any(SlaViolation.class))).thenAnswer(inv -> inv.getArgument(0));

        SlaViolationResponse response = slaService.resolveViolation(violationId);

        assertThat(response.status()).isEqualTo(ViolationStatus.RESOLVED);
        assertThat(response.resolvedAt()).isNotNull();
        verify(auditService).logStatusChange("SlaViolation", violationId, "DETECTED", "RESOLVED");
    }

    @Test
    @DisplayName("Should throw when SLA not found for violation creation")
    void createViolation_SlaNotFound() {
        UUID nonExistentSlaId = UUID.randomUUID();
        CreateSlaViolationRequest request = new CreateSlaViolationRequest(
                nonExistentSlaId, LocalDate.now(), new BigDecimal("100"), null);

        when(slaRepository.findById(nonExistentSlaId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> slaService.createViolation(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SLA не найден");
    }
}
