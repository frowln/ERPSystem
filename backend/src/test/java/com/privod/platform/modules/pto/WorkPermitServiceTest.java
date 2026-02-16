package com.privod.platform.modules.pto;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.WorkPermit;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import com.privod.platform.modules.pto.domain.WorkType;
import com.privod.platform.modules.pto.repository.WorkPermitRepository;
import com.privod.platform.modules.pto.service.PtoCodeGenerator;
import com.privod.platform.modules.pto.service.WorkPermitService;
import com.privod.platform.modules.pto.web.dto.CreateWorkPermitRequest;
import com.privod.platform.modules.pto.web.dto.WorkPermitResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkPermitServiceTest {

    @Mock
    private WorkPermitRepository workPermitRepository;

    @Mock
    private PtoCodeGenerator codeGenerator;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WorkPermitService workPermitService;

    private UUID permitId;
    private UUID projectId;
    private WorkPermit testPermit;

    @BeforeEach
    void setUp() {
        permitId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testPermit = WorkPermit.builder()
                .projectId(projectId)
                .code("WP-20260213-00001")
                .workType(WorkType.CONCRETE)
                .location("Секция А, этаж 3")
                .startDate(LocalDate.of(2026, 2, 13))
                .endDate(LocalDate.of(2026, 2, 20))
                .status(WorkPermitStatus.DRAFT)
                .safetyMeasures(Map.of("ppe", "каска, страховка"))
                .build();
        testPermit.setId(permitId);
        testPermit.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Work Permit")
    class CreateWorkPermitTests {

        @Test
        @DisplayName("Should create work permit with DRAFT status")
        void createWorkPermit_Success() {
            CreateWorkPermitRequest request = new CreateWorkPermitRequest(
                    projectId, WorkType.CONCRETE, "Секция А",
                    LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 10),
                    null, Map.of("fire_extinguisher", true), "Примечание");

            when(codeGenerator.generateWorkPermitCode()).thenReturn("WP-20260213-00002");
            when(workPermitRepository.save(any(WorkPermit.class))).thenAnswer(inv -> {
                WorkPermit p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            WorkPermitResponse response = workPermitService.createWorkPermit(request);

            assertThat(response.status()).isEqualTo(WorkPermitStatus.DRAFT);
            assertThat(response.code()).isEqualTo("WP-20260213-00002");
            assertThat(response.workType()).isEqualTo(WorkType.CONCRETE);
            verify(auditService).logCreate(eq("WorkPermit"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject work permit with end date before start date")
        void createWorkPermit_InvalidDates() {
            CreateWorkPermitRequest request = new CreateWorkPermitRequest(
                    projectId, WorkType.ELECTRICAL, "Секция Б",
                    LocalDate.of(2026, 3, 10), LocalDate.of(2026, 3, 1),
                    null, null, null);

            assertThatThrownBy(() -> workPermitService.createWorkPermit(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания не может быть раньше даты начала");
        }
    }

    @Nested
    @DisplayName("Change Work Permit Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should transition from DRAFT to ISSUED")
        void changeStatus_DraftToIssued() {
            when(workPermitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));
            when(workPermitRepository.save(any(WorkPermit.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkPermitResponse response = workPermitService.changeStatus(permitId, WorkPermitStatus.ISSUED);

            assertThat(response.status()).isEqualTo(WorkPermitStatus.ISSUED);
            verify(auditService).logStatusChange("WorkPermit", permitId, "DRAFT", "ISSUED");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> ACTIVE")
        void changeStatus_InvalidTransition() {
            when(workPermitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));

            assertThatThrownBy(() -> workPermitService.changeStatus(permitId, WorkPermitStatus.ACTIVE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести наряд-допуск");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for missing permit")
        void changeStatus_NotFound() {
            UUID missingId = UUID.randomUUID();
            when(workPermitRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> workPermitService.changeStatus(missingId, WorkPermitStatus.ISSUED))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Наряд-допуск не найден");
        }
    }

    @Nested
    @DisplayName("Delete Work Permit")
    class DeleteTests {

        @Test
        @DisplayName("Should soft-delete work permit")
        void deleteWorkPermit_Success() {
            when(workPermitRepository.findById(permitId)).thenReturn(Optional.of(testPermit));
            when(workPermitRepository.save(any(WorkPermit.class))).thenAnswer(inv -> inv.getArgument(0));

            workPermitService.deleteWorkPermit(permitId);

            assertThat(testPermit.isDeleted()).isTrue();
            verify(auditService).logDelete("WorkPermit", permitId);
        }
    }
}
