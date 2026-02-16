package com.privod.platform.modules.pto;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.LabTest;
import com.privod.platform.modules.pto.domain.LabTestConclusion;
import com.privod.platform.modules.pto.domain.LabTestType;
import com.privod.platform.modules.pto.repository.LabTestRepository;
import com.privod.platform.modules.pto.service.LabTestService;
import com.privod.platform.modules.pto.service.PtoCodeGenerator;
import com.privod.platform.modules.pto.web.dto.CreateLabTestRequest;
import com.privod.platform.modules.pto.web.dto.LabTestResponse;
import jakarta.persistence.EntityNotFoundException;
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
class LabTestServiceTest {

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private PtoCodeGenerator codeGenerator;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private LabTestService labTestService;

    private UUID labTestId;
    private UUID projectId;
    private LabTest testLabTest;

    @BeforeEach
    void setUp() {
        labTestId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testLabTest = LabTest.builder()
                .projectId(projectId)
                .code("LT-20260213-00001")
                .materialName("Бетон М300")
                .testType(LabTestType.STRENGTH)
                .sampleNumber("S-001")
                .testDate(LocalDate.of(2026, 2, 10))
                .result("28.5 МПа")
                .conclusion(LabTestConclusion.PASSED)
                .labName("СтройЛаб")
                .build();
        testLabTest.setId(labTestId);
        testLabTest.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create lab test with auto-generated code")
    void createLabTest_Success() {
        CreateLabTestRequest request = new CreateLabTestRequest(
                projectId, "Бетон М300", LabTestType.STRENGTH, "S-002",
                LocalDate.of(2026, 2, 12), "30.1 МПа", LabTestConclusion.PASSED,
                null, "СтройЛаб", null);

        when(codeGenerator.generateLabTestCode()).thenReturn("LT-20260213-00002");
        when(labTestRepository.save(any(LabTest.class))).thenAnswer(inv -> {
            LabTest t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            t.setCreatedAt(Instant.now());
            return t;
        });

        LabTestResponse response = labTestService.createLabTest(request);

        assertThat(response.code()).isEqualTo("LT-20260213-00002");
        assertThat(response.materialName()).isEqualTo("Бетон М300");
        assertThat(response.testType()).isEqualTo(LabTestType.STRENGTH);
        assertThat(response.conclusion()).isEqualTo(LabTestConclusion.PASSED);
        verify(auditService).logCreate(eq("LabTest"), any(UUID.class));
    }

    @Test
    @DisplayName("Should return lab test by ID")
    void getLabTest_Success() {
        when(labTestRepository.findById(labTestId)).thenReturn(Optional.of(testLabTest));

        LabTestResponse response = labTestService.getLabTest(labTestId);

        assertThat(response.id()).isEqualTo(labTestId);
        assertThat(response.materialName()).isEqualTo("Бетон М300");
        assertThat(response.conclusionDisplayName()).isEqualTo("Соответствует");
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException for missing lab test")
    void getLabTest_NotFound() {
        UUID missingId = UUID.randomUUID();
        when(labTestRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> labTestService.getLabTest(missingId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Лабораторное испытание не найдено");
    }

    @Test
    @DisplayName("Should soft-delete lab test")
    void deleteLabTest_Success() {
        when(labTestRepository.findById(labTestId)).thenReturn(Optional.of(testLabTest));
        when(labTestRepository.save(any(LabTest.class))).thenAnswer(inv -> inv.getArgument(0));

        labTestService.deleteLabTest(labTestId);

        assertThat(testLabTest.isDeleted()).isTrue();
        verify(auditService).logDelete("LabTest", labTestId);
    }
}
