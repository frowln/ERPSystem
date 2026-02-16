package com.privod.platform.modules.regulatory;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.ConstructionPermit;
import com.privod.platform.modules.regulatory.domain.PermitStatus;
import com.privod.platform.modules.regulatory.repository.ConstructionPermitRepository;
import com.privod.platform.modules.regulatory.service.ConstructionPermitService;
import com.privod.platform.modules.regulatory.web.dto.ConstructionPermitResponse;
import com.privod.platform.modules.regulatory.web.dto.CreateConstructionPermitRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class ConstructionPermitServiceTest {

    @Mock
    private ConstructionPermitRepository permitRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ConstructionPermitService permitService;

    private UUID permitId;
    private ConstructionPermit testPermit;

    @BeforeEach
    void setUp() {
        permitId = UUID.randomUUID();

        testPermit = ConstructionPermit.builder()
                .projectId(UUID.randomUUID())
                .permitNumber("РС-2025-001")
                .issuedBy("Госстройнадзор")
                .issuedDate(LocalDate.of(2025, 1, 15))
                .expiresDate(LocalDate.of(2027, 1, 15))
                .status(PermitStatus.ACTIVE)
                .permitType("Разрешение на строительство")
                .build();
        testPermit.setId(permitId);
        testPermit.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create permit with ACTIVE status")
    void createPermit_SetsActiveStatus() {
        CreateConstructionPermitRequest request = new CreateConstructionPermitRequest(
                UUID.randomUUID(), "РС-2025-002", "Госстройнадзор",
                LocalDate.of(2025, 3, 1), LocalDate.of(2027, 3, 1),
                "Разрешение на строительство", null, null);

        when(permitRepository.save(any(ConstructionPermit.class))).thenAnswer(invocation -> {
            ConstructionPermit p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            p.setCreatedAt(Instant.now());
            return p;
        });

        ConstructionPermitResponse response = permitService.createPermit(request);

        assertThat(response.status()).isEqualTo(PermitStatus.ACTIVE);
        assertThat(response.permitNumber()).isEqualTo("РС-2025-002");
        verify(auditService).logCreate(eq("ConstructionPermit"), any(UUID.class));
    }

    @Test
    @DisplayName("Should suspend active permit")
    void suspendPermit_ValidTransition() {
        when(permitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));
        when(permitRepository.save(any(ConstructionPermit.class))).thenAnswer(inv -> inv.getArgument(0));

        ConstructionPermitResponse response = permitService.suspendPermit(permitId);

        assertThat(response.status()).isEqualTo(PermitStatus.SUSPENDED);
        verify(auditService).logStatusChange("ConstructionPermit", permitId,
                "ACTIVE", "SUSPENDED");
    }

    @Test
    @DisplayName("Should reject suspending non-active permit")
    void suspendPermit_InvalidFromExpired() {
        testPermit.setStatus(PermitStatus.EXPIRED);
        when(permitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));

        assertThatThrownBy(() -> permitService.suspendPermit(permitId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Приостановить можно только действующее разрешение");
    }

    @Test
    @DisplayName("Should revoke permit")
    void revokePermit_Success() {
        when(permitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));
        when(permitRepository.save(any(ConstructionPermit.class))).thenAnswer(inv -> inv.getArgument(0));

        ConstructionPermitResponse response = permitService.revokePermit(permitId);

        assertThat(response.status()).isEqualTo(PermitStatus.REVOKED);
    }

    @Test
    @DisplayName("Should reject revoking already revoked permit")
    void revokePermit_AlreadyRevoked() {
        testPermit.setStatus(PermitStatus.REVOKED);
        when(permitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));

        assertThatThrownBy(() -> permitService.revokePermit(permitId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Разрешение уже отозвано");
    }
}
