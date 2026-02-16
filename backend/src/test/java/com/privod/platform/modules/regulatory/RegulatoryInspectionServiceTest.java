package com.privod.platform.modules.regulatory;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.InspectionResult;
import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspection;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspectionType;
import com.privod.platform.modules.regulatory.repository.PrescriptionRepository;
import com.privod.platform.modules.regulatory.repository.RegulatoryInspectionRepository;
import com.privod.platform.modules.regulatory.service.RegulatoryInspectionService;
import com.privod.platform.modules.regulatory.web.dto.CreatePrescriptionRequest;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryInspectionRequest;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionResponse;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryInspectionResponse;
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
class RegulatoryInspectionServiceTest {

    @Mock
    private RegulatoryInspectionRepository inspectionRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RegulatoryInspectionService inspectionService;

    private UUID inspectionId;
    private RegulatoryInspection testInspection;

    @BeforeEach
    void setUp() {
        inspectionId = UUID.randomUUID();

        testInspection = RegulatoryInspection.builder()
                .projectId(UUID.randomUUID())
                .inspectionDate(LocalDate.of(2025, 5, 10))
                .inspectorName("Иванов И.И.")
                .inspectorOrgan("Ростехнадзор")
                .inspectionType(RegulatoryInspectionType.PLANNED)
                .result(InspectionResult.VIOLATIONS)
                .actNumber("АКТ-2025-001")
                .build();
        testInspection.setId(inspectionId);
        testInspection.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Inspection")
    class CreateInspectionTests {

        @Test
        @DisplayName("Should create regulatory inspection")
        void createInspection_Success() {
            CreateRegulatoryInspectionRequest request = new CreateRegulatoryInspectionRequest(
                    UUID.randomUUID(), LocalDate.of(2025, 6, 1),
                    "Петров П.П.", "Госстройнадзор",
                    RegulatoryInspectionType.UNPLANNED, null,
                    null, null, null, null, null);

            when(inspectionRepository.save(any(RegulatoryInspection.class))).thenAnswer(invocation -> {
                RegulatoryInspection i = invocation.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });

            RegulatoryInspectionResponse response = inspectionService.createInspection(request);

            assertThat(response.inspectionType()).isEqualTo(RegulatoryInspectionType.UNPLANNED);
            assertThat(response.inspectorName()).isEqualTo("Петров П.П.");
            verify(auditService).logCreate(eq("RegulatoryInspection"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Prescriptions")
    class PrescriptionTests {

        @Test
        @DisplayName("Should add prescription to inspection")
        void addPrescription_Success() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(prescriptionRepository.getNextNumberSequence()).thenReturn(1L);
            when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> {
                Prescription p = invocation.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            CreatePrescriptionRequest request = new CreatePrescriptionRequest(
                    inspectionId, "Устранить нарушение ограждений",
                    LocalDate.of(2025, 6, 15), UUID.randomUUID());

            PrescriptionResponse response = inspectionService.addPrescription(inspectionId, request);

            assertThat(response.number()).isEqualTo("PRE-00001");
            assertThat(response.status()).isEqualTo(PrescriptionStatus.OPEN);
            assertThat(response.description()).isEqualTo("Устранить нарушение ограждений");
        }

        @Test
        @DisplayName("Should complete a prescription")
        void completePrescription_Success() {
            UUID prescriptionId = UUID.randomUUID();
            Prescription prescription = Prescription.builder()
                    .inspectionId(inspectionId)
                    .number("PRE-00001")
                    .description("Устранить нарушение")
                    .status(PrescriptionStatus.OPEN)
                    .build();
            prescription.setId(prescriptionId);
            prescription.setCreatedAt(Instant.now());

            when(prescriptionRepository.findById(prescriptionId)).thenReturn(Optional.of(prescription));
            when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> inv.getArgument(0));

            PrescriptionResponse response = inspectionService.completePrescription(prescriptionId, "http://evidence.url");

            assertThat(response.status()).isEqualTo(PrescriptionStatus.COMPLETED);
            assertThat(response.evidenceUrl()).isEqualTo("http://evidence.url");
            verify(auditService).logStatusChange("Prescription", prescriptionId,
                    "OPEN", "COMPLETED");
        }

        @Test
        @DisplayName("Should reject completing already completed prescription")
        void completePrescription_AlreadyCompleted() {
            UUID prescriptionId = UUID.randomUUID();
            Prescription prescription = Prescription.builder()
                    .status(PrescriptionStatus.COMPLETED)
                    .description("test")
                    .build();
            prescription.setId(prescriptionId);

            when(prescriptionRepository.findById(prescriptionId)).thenReturn(Optional.of(prescription));

            assertThatThrownBy(() -> inspectionService.completePrescription(prescriptionId, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Предписание уже выполнено");
        }
    }
}
