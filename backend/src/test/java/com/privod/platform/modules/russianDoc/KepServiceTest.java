package com.privod.platform.modules.russianDoc;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.russianDoc.domain.KepCertificateStatus;
import com.privod.platform.modules.kep.domain.KepSignature;
import com.privod.platform.modules.russianDoc.domain.KepSignatureRequest;
import com.privod.platform.modules.russianDoc.domain.KepSignatureRequestStatus;
import com.privod.platform.modules.russianDoc.repository.KepCertificateRepository;
import com.privod.platform.modules.russianDoc.repository.KepSignatureRepository;
import com.privod.platform.modules.russianDoc.repository.KepSignatureRequestRepository;
import com.privod.platform.modules.russianDoc.service.KepService;
import com.privod.platform.modules.russianDoc.web.dto.CreateKepCertificateRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateKepSignatureRequest;
import com.privod.platform.modules.russianDoc.web.dto.KepCertificateResponse;
import com.privod.platform.modules.russianDoc.web.dto.KepSignatureResponse;
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
class KepServiceTest {

    @Mock
    private KepCertificateRepository certificateRepository;
    @Mock
    private KepSignatureRepository signatureRepository;
    @Mock
    private KepSignatureRequestRepository requestRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private KepService kepService;

    private UUID certId;
    private KepCertificate testCert;

    @BeforeEach
    void setUp() {
        certId = UUID.randomUUID();

        testCert = KepCertificate.builder()
                .owner("Иванов Иван Иванович")
                .serialNumber("01A2B3C4D5E6F7890123")
                .issuer("ООО \"Тестовый УЦ\"")
                .validFrom(LocalDate.now().minusMonths(6))
                .validTo(LocalDate.now().plusMonths(6))
                .thumbprint("AABBCCDD11223344")
                .status(KepCertificateStatus.ACTIVE)
                .certificateData("base64certdata")
                .build();
        testCert.setId(certId);
        testCert.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Certificate")
    class CreateCertificateTests {

        @Test
        @DisplayName("Should create certificate with ACTIVE status")
        void createCertificate_SetsActiveStatus() {
            CreateKepCertificateRequest request = new CreateKepCertificateRequest(
                    "Петров П.П.", "SERIAL123", "УЦ Тест",
                    LocalDate.now(), LocalDate.now().plusYears(1),
                    "THUMB123", "certdata", null);

            when(certificateRepository.save(any(KepCertificate.class))).thenAnswer(inv -> {
                KepCertificate c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            KepCertificateResponse response = kepService.createCertificate(request);

            assertThat(response.status()).isEqualTo(KepCertificateStatus.ACTIVE);
            assertThat(response.owner()).isEqualTo("Петров П.П.");
            verify(auditService).logCreate(eq("KepCertificate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Revoke Certificate")
    class RevokeCertificateTests {

        @Test
        @DisplayName("Should revoke active certificate")
        void revokeCertificate_ChangesToRevoked() {
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(certificateRepository.save(any(KepCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            KepCertificateResponse response = kepService.revokeCertificate(certId);

            assertThat(response.status()).isEqualTo(KepCertificateStatus.REVOKED);
            verify(auditService).logStatusChange("KepCertificate", certId, "ACTIVE", "REVOKED");
        }

        @Test
        @DisplayName("Should throw when revoking already revoked certificate")
        void revokeCertificate_ThrowsForAlreadyRevoked() {
            testCert.setStatus(KepCertificateStatus.REVOKED);
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));

            assertThatThrownBy(() -> kepService.revokeCertificate(certId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже отозван");
        }
    }

    @Nested
    @DisplayName("Create Signature")
    class CreateSignatureTests {

        @Test
        @DisplayName("Should create signature with valid certificate")
        void createSignature_WithValidCert() {
            UUID docId = UUID.randomUUID();
            UUID signerId = UUID.randomUUID();

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));
            when(signatureRepository.save(any(KepSignature.class))).thenAnswer(inv -> {
                KepSignature s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            CreateKepSignatureRequest request = new CreateKepSignatureRequest(
                    "UPD", docId, certId, signerId, "sigdata");

            KepSignatureResponse response = kepService.createSignature(request);

            assertThat(response.documentType()).isEqualTo("UPD");
            assertThat(response.documentId()).isEqualTo(docId);
            assertThat(response.valid()).isTrue();
            verify(auditService).logCreate(eq("KepSignature"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when signing with expired certificate")
        void createSignature_ThrowsForExpiredCert() {
            testCert.setStatus(KepCertificateStatus.EXPIRED);

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(testCert));

            CreateKepSignatureRequest request = new CreateKepSignatureRequest(
                    "TORG12", UUID.randomUUID(), certId, UUID.randomUUID(), null);

            assertThatThrownBy(() -> kepService.createSignature(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("недействителен");
        }
    }

    @Nested
    @DisplayName("Expire Overdue Certificates")
    class ExpireOverdueTests {

        @Test
        @DisplayName("Should expire certificates past valid_to date")
        void expireOverdue_MarksExpired() {
            KepCertificate expiredCert = KepCertificate.builder()
                    .owner("Expired User")
                    .serialNumber("EXP001")
                    .issuer("UC Test")
                    .validFrom(LocalDate.now().minusYears(2))
                    .validTo(LocalDate.now().minusDays(1))
                    .thumbprint("EXPTHUMB")
                    .status(KepCertificateStatus.ACTIVE)
                    .build();
            expiredCert.setId(UUID.randomUUID());

            when(certificateRepository.findExpiredActive(any(LocalDate.class)))
                    .thenReturn(List.of(expiredCert));
            when(certificateRepository.save(any(KepCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            int count = kepService.expireOverdueCertificates();

            assertThat(count).isEqualTo(1);
            assertThat(expiredCert.getStatus()).isEqualTo(KepCertificateStatus.EXPIRED);
        }
    }

    @Nested
    @DisplayName("Reject Signature Request")
    class RejectSignatureRequestTests {

        @Test
        @DisplayName("Should reject pending signature request")
        void rejectRequest_ChangesToRejected() {
            UUID reqId = UUID.randomUUID();
            KepSignatureRequest request = KepSignatureRequest.builder()
                    .documentType("ACT")
                    .documentId(UUID.randomUUID())
                    .requestedById(UUID.randomUUID())
                    .requestedToId(UUID.randomUUID())
                    .status(KepSignatureRequestStatus.PENDING)
                    .build();
            request.setId(reqId);
            request.setCreatedAt(Instant.now());

            when(requestRepository.findById(reqId)).thenReturn(Optional.of(request));
            when(requestRepository.save(any(KepSignatureRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            KepSignatureRequest result = kepService.rejectSignatureRequest(reqId, "Неверные данные");

            assertThat(result.getStatus()).isEqualTo(KepSignatureRequestStatus.REJECTED);
            assertThat(result.getComment()).isEqualTo("Неверные данные");
        }
    }
}
