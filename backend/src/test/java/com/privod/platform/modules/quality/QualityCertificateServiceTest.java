package com.privod.platform.modules.quality;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CertificateType;
import com.privod.platform.modules.quality.domain.QualityCertificate;
import com.privod.platform.modules.quality.repository.QualityCertificateRepository;
import com.privod.platform.modules.quality.service.QualityCertificateService;
import com.privod.platform.modules.quality.web.dto.CreateQualityCertificateRequest;
import com.privod.platform.modules.quality.web.dto.QualityCertificateResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QualityCertificateServiceTest {

    @Mock
    private QualityCertificateRepository certificateRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private QualityCertificateService certificateService;

    private UUID certId;
    private QualityCertificate testCert;

    @BeforeEach
    void setUp() {
        certId = UUID.randomUUID();

        testCert = QualityCertificate.builder()
                .materialId(UUID.randomUUID())
                .supplierId(UUID.randomUUID())
                .supplierName("ООО СтройМатериалы")
                .certificateNumber("ГОСТ-2025-001234")
                .issueDate(LocalDate.of(2025, 1, 15))
                .expiryDate(LocalDate.of(2026, 1, 15))
                .certificateType(CertificateType.GOST)
                .fileUrl("/files/cert-001234.pdf")
                .isVerified(false)
                .build();
        testCert.setId(certId);
        testCert.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Certificate")
    class CreateTests {

        @Test
        @DisplayName("Should create certificate with unverified status")
        void createCertificate_Success() {
            CreateQualityCertificateRequest request = new CreateQualityCertificateRequest(
                    UUID.randomUUID(), UUID.randomUUID(),
                    "ООО ЖелезоБетон",
                    "TU-2025-005678",
                    LocalDate.of(2025, 3, 1),
                    LocalDate.of(2026, 3, 1),
                    CertificateType.TU,
                    "/files/cert-tu-005678.pdf"
            );

            when(certificateRepository.save(any(QualityCertificate.class))).thenAnswer(inv -> {
                QualityCertificate cert = inv.getArgument(0);
                cert.setId(UUID.randomUUID());
                cert.setCreatedAt(Instant.now());
                return cert;
            });

            QualityCertificateResponse response = certificateService.createCertificate(request);

            assertThat(response.isVerified()).isFalse();
            assertThat(response.certificateType()).isEqualTo(CertificateType.TU);
            assertThat(response.certificateNumber()).isEqualTo("TU-2025-005678");
            verify(auditService).logCreate(eq("QualityCertificate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Verify Certificate")
    class VerifyTests {

        @Test
        @DisplayName("Should verify certificate and set verifier")
        void verifyCertificate_Success() {
            UUID verifiedById = UUID.randomUUID();
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(certificateRepository.save(any(QualityCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            QualityCertificateResponse response = certificateService.verifyCertificate(certId, verifiedById);

            assertThat(response.isVerified()).isTrue();
            assertThat(response.verifiedById()).isEqualTo(verifiedById);
            verify(auditService).logUpdate("QualityCertificate", certId, "isVerified", "false", "true");
        }
    }
}
