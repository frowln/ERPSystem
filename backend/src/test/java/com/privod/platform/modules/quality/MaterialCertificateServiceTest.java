package com.privod.platform.modules.quality;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CertificateLine;
import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateType;
import com.privod.platform.modules.quality.repository.CertificateLineRepository;
import com.privod.platform.modules.quality.repository.MaterialCertificateRepository;
import com.privod.platform.modules.quality.service.MaterialCertificateService;
import com.privod.platform.modules.quality.web.dto.CertificateLineResponse;
import com.privod.platform.modules.quality.web.dto.CreateCertificateLineRequest;
import com.privod.platform.modules.quality.web.dto.CreateMaterialCertificateRequest;
import com.privod.platform.modules.quality.web.dto.MaterialCertificateResponse;
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
class MaterialCertificateServiceTest {

    @Mock
    private MaterialCertificateRepository certificateRepository;

    @Mock
    private CertificateLineRepository lineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MaterialCertificateService materialCertificateService;

    private UUID certId;
    private UUID materialId;
    private MaterialCertificate testCert;

    @BeforeEach
    void setUp() {
        certId = UUID.randomUUID();
        materialId = UUID.randomUUID();

        testCert = MaterialCertificate.builder()
                .materialId(materialId)
                .materialName("Арматура А500С")
                .certificateNumber("СЕРТ-2025-001")
                .certificateType(MaterialCertificateType.QUALITY)
                .issuedBy("ОТК завода НЛМК")
                .issuedDate(LocalDate.of(2025, 1, 15))
                .expiryDate(LocalDate.of(2026, 1, 15))
                .fileUrl("/files/cert-001.pdf")
                .status(MaterialCertificateStatus.PENDING_VERIFICATION)
                .notes("Партия 500 тонн")
                .build();
        testCert.setId(certId);
        testCert.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Certificate")
    class CreateCertificateTests {

        @Test
        @DisplayName("Should create certificate with PENDING_VERIFICATION status")
        void createCertificate_SetsPendingVerification() {
            CreateMaterialCertificateRequest request = new CreateMaterialCertificateRequest(
                    materialId, "Бетон М300", "СЕРТ-2025-002",
                    MaterialCertificateType.CONFORMITY, "Лаборатория ООО СтройТест",
                    LocalDate.of(2025, 3, 1), LocalDate.of(2026, 3, 1),
                    "/files/cert-002.pdf", "Серия 12345"
            );

            when(certificateRepository.save(any(MaterialCertificate.class))).thenAnswer(inv -> {
                MaterialCertificate c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            MaterialCertificateResponse response = materialCertificateService.createCertificate(request);

            assertThat(response.status()).isEqualTo(MaterialCertificateStatus.PENDING_VERIFICATION);
            assertThat(response.certificateNumber()).isEqualTo("СЕРТ-2025-002");
            assertThat(response.certificateType()).isEqualTo(MaterialCertificateType.CONFORMITY);
            assertThat(response.materialName()).isEqualTo("Бетон М300");
            verify(auditService).logCreate(eq("MaterialCertificate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Verify Certificate")
    class VerifyCertificateTests {

        @Test
        @DisplayName("Should verify certificate and set VALID status")
        void verifyCertificate_SetsValidStatus() {
            UUID verifierId = UUID.randomUUID();
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(certificateRepository.save(any(MaterialCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            MaterialCertificateResponse response = materialCertificateService.verifyCertificate(certId, verifierId);

            assertThat(response.status()).isEqualTo(MaterialCertificateStatus.VALID);
            assertThat(response.verifiedById()).isEqualTo(verifierId);
            assertThat(response.verifiedAt()).isNotNull();
            verify(auditService).logUpdate("MaterialCertificate", certId,
                    "status", "PENDING_VERIFICATION", "VALID");
        }

        @Test
        @DisplayName("Should throw when certificate not found")
        void verifyCertificate_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(certificateRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> materialCertificateService.verifyCertificate(nonExistentId, UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Сертификат материала не найден");
        }
    }

    @Nested
    @DisplayName("Get Expired Certificates")
    class GetExpiredCertificatesTests {

        @Test
        @DisplayName("Should return list of expired certificates")
        void getExpiredCertificates_ReturnsList() {
            MaterialCertificate expired = MaterialCertificate.builder()
                    .materialId(UUID.randomUUID())
                    .materialName("Сталь 09Г2С")
                    .certificateNumber("СЕРТ-2024-010")
                    .certificateType(MaterialCertificateType.GOST)
                    .issuedDate(LocalDate.of(2024, 1, 1))
                    .expiryDate(LocalDate.of(2024, 12, 31))
                    .status(MaterialCertificateStatus.VALID)
                    .build();
            expired.setId(UUID.randomUUID());
            expired.setCreatedAt(Instant.now());

            when(certificateRepository.findExpiredCertificates(any(LocalDate.class)))
                    .thenReturn(List.of(expired));

            List<MaterialCertificateResponse> result = materialCertificateService.getExpiredCertificates();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).certificateNumber()).isEqualTo("СЕРТ-2024-010");
        }
    }

    @Nested
    @DisplayName("Get Expiring Certificates")
    class GetExpiringCertificatesTests {

        @Test
        @DisplayName("Should return certificates expiring within given days")
        void getExpiringCertificates_ReturnsMatchingCerts() {
            when(certificateRepository.findExpiringCertificates(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(testCert));

            List<MaterialCertificateResponse> result = materialCertificateService.getExpiringCertificates(30);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).certificateNumber()).isEqualTo("СЕРТ-2025-001");
        }

        @Test
        @DisplayName("Should return empty list when no certificates expiring soon")
        void getExpiringCertificates_EmptyList() {
            when(certificateRepository.findExpiringCertificates(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of());

            List<MaterialCertificateResponse> result = materialCertificateService.getExpiringCertificates(7);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Add Line")
    class AddLineTests {

        @Test
        @DisplayName("Should add certificate line with compliant = true by default")
        void addLine_DefaultCompliant() {
            CreateCertificateLineRequest request = new CreateCertificateLineRequest(
                    "Предел прочности", "не менее 500 МПа", "520 МПа",
                    "МПа", null, "ГОСТ 12004"
            );

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(lineRepository.save(any(CertificateLine.class))).thenAnswer(inv -> {
                CertificateLine line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            CertificateLineResponse response = materialCertificateService.addLine(certId, request);

            assertThat(response.parameterName()).isEqualTo("Предел прочности");
            assertThat(response.standardValue()).isEqualTo("не менее 500 МПа");
            assertThat(response.actualValue()).isEqualTo("520 МПа");
            assertThat(response.isCompliant()).isTrue();
            assertThat(response.testMethod()).isEqualTo("ГОСТ 12004");
            verify(auditService).logCreate(eq("CertificateLine"), any(UUID.class));
        }

        @Test
        @DisplayName("Should add certificate line with explicit non-compliant flag")
        void addLine_ExplicitNonCompliant() {
            CreateCertificateLineRequest request = new CreateCertificateLineRequest(
                    "Относительное удлинение", "не менее 14%", "11%",
                    "%", false, "ГОСТ 12004"
            );

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(lineRepository.save(any(CertificateLine.class))).thenAnswer(inv -> {
                CertificateLine line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            CertificateLineResponse response = materialCertificateService.addLine(certId, request);

            assertThat(response.isCompliant()).isFalse();
        }
    }

    @Nested
    @DisplayName("Remove Line")
    class RemoveLineTests {

        @Test
        @DisplayName("Should soft-delete certificate line")
        void removeLine_Success() {
            UUID lineId = UUID.randomUUID();
            CertificateLine line = CertificateLine.builder()
                    .certificateId(certId)
                    .parameterName("Тест")
                    .build();
            line.setId(lineId);

            when(lineRepository.findById(lineId)).thenReturn(Optional.of(line));
            when(lineRepository.save(any(CertificateLine.class))).thenAnswer(inv -> inv.getArgument(0));

            materialCertificateService.removeLine(lineId);

            assertThat(line.isDeleted()).isTrue();
            verify(auditService).logDelete("CertificateLine", lineId);
        }

        @Test
        @DisplayName("Should throw when line not found")
        void removeLine_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(lineRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> materialCertificateService.removeLine(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Строка сертификата не найдена");
        }
    }
}
