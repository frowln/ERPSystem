package com.privod.platform.modules.quality;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.NonConformance;
import com.privod.platform.modules.quality.domain.NonConformanceSeverity;
import com.privod.platform.modules.quality.domain.NonConformanceStatus;
import com.privod.platform.modules.quality.repository.NonConformanceRepository;
import com.privod.platform.modules.quality.service.NonConformanceService;
import com.privod.platform.modules.quality.web.dto.CreateNonConformanceRequest;
import com.privod.platform.modules.quality.web.dto.NonConformanceResponse;
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
class NonConformanceServiceTest {

    @Mock
    private NonConformanceRepository nonConformanceRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private NonConformanceService nonConformanceService;

    private UUID ncId;
    private UUID projectId;
    private NonConformance testNc;

    @BeforeEach
    void setUp() {
        ncId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testNc = NonConformance.builder()
                .code("NCR-00001")
                .projectId(projectId)
                .qualityCheckId(UUID.randomUUID())
                .severity(NonConformanceSeverity.MAJOR)
                .description("Отклонение прочности бетона от проектных значений")
                .status(NonConformanceStatus.OPEN)
                .responsibleId(UUID.randomUUID())
                .dueDate(LocalDate.of(2025, 7, 30))
                .cost(new BigDecimal("150000.00"))
                .build();
        testNc.setId(ncId);
        testNc.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Non-Conformance")
    class CreateTests {

        @Test
        @DisplayName("Should create non-conformance with OPEN status")
        void createNonConformance_SetsDefaults() {
            CreateNonConformanceRequest request = new CreateNonConformanceRequest(
                    UUID.randomUUID(), projectId,
                    NonConformanceSeverity.CRITICAL,
                    "Трещины в несущей конструкции",
                    null, null, null,
                    UUID.randomUUID(),
                    LocalDate.of(2025, 8, 1),
                    new BigDecimal("500000.00")
            );

            when(nonConformanceRepository.getNextNumberSequence()).thenReturn(1L);
            when(nonConformanceRepository.save(any(NonConformance.class))).thenAnswer(inv -> {
                NonConformance nc = inv.getArgument(0);
                nc.setId(UUID.randomUUID());
                nc.setCreatedAt(Instant.now());
                return nc;
            });

            NonConformanceResponse response = nonConformanceService.createNonConformance(request);

            assertThat(response.status()).isEqualTo(NonConformanceStatus.OPEN);
            assertThat(response.code()).isEqualTo("NCR-00001");
            assertThat(response.severity()).isEqualTo(NonConformanceSeverity.CRITICAL);
            verify(auditService).logCreate(eq("NonConformance"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Close Non-Conformance")
    class CloseTests {

        @Test
        @DisplayName("Should close non-conformance and set resolved date")
        void closeNonConformance_Success() {
            when(nonConformanceRepository.findById(ncId)).thenReturn(Optional.of(testNc));
            when(nonConformanceRepository.save(any(NonConformance.class))).thenAnswer(inv -> inv.getArgument(0));

            NonConformanceResponse response = nonConformanceService.closeNonConformance(ncId);

            assertThat(response.status()).isEqualTo(NonConformanceStatus.CLOSED);
            assertThat(response.resolvedDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("NonConformance", ncId, "OPEN", "CLOSED");
        }

        @Test
        @DisplayName("Should reject closing already closed non-conformance")
        void closeNonConformance_AlreadyClosed() {
            testNc.setStatus(NonConformanceStatus.CLOSED);
            when(nonConformanceRepository.findById(ncId)).thenReturn(Optional.of(testNc));

            assertThatThrownBy(() -> nonConformanceService.closeNonConformance(ncId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Несоответствие уже закрыто");
        }
    }

    @Nested
    @DisplayName("Get Non-Conformance")
    class GetTests {

        @Test
        @DisplayName("Should throw when non-conformance not found")
        void getNonConformance_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(nonConformanceRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> nonConformanceService.getNonConformance(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Несоответствие не найдено");
        }
    }
}
