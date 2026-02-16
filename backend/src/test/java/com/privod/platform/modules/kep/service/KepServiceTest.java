package com.privod.platform.modules.kep.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.kep.domain.KepCertificateStatus;
import com.privod.platform.modules.kep.domain.KepPriority;
import com.privod.platform.modules.kep.domain.KepSignature;
import com.privod.platform.modules.kep.domain.KepSigningRequest;
import com.privod.platform.modules.kep.domain.KepSigningStatus;
import com.privod.platform.modules.kep.repository.KepCertificateRepository;
import com.privod.platform.modules.kep.repository.KepSignatureRepository;
import com.privod.platform.modules.kep.repository.KepSigningRequestRepository;
import com.privod.platform.modules.kep.web.dto.CreateKepCertificateRequest;
import com.privod.platform.modules.kep.web.dto.CreateSigningRequestRequest;
import com.privod.platform.modules.kep.web.dto.KepCertificateResponse;
import com.privod.platform.modules.kep.web.dto.KepSignatureResponse;
import com.privod.platform.modules.kep.web.dto.KepSigningRequestResponse;
import com.privod.platform.modules.kep.web.dto.SignDocumentRequest;
import com.privod.platform.modules.kep.web.dto.VerifySignatureResponse;
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
import java.time.LocalDateTime;
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
    private KepSigningRequestRepository signingRequestRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private KepService kepService;

    private UUID certId;
    private UUID ownerId;
    private KepCertificate activeCert;

    @BeforeEach
    void setUp() {
        certId = UUID.randomUUID();
        ownerId = UUID.randomUUID();

        activeCert = KepCertificate.builder()
                .ownerId(ownerId)
                .ownerName("Иванов Иван Иванович")
                .serialNumber("SN-001")
                .issuer("КриптоПро УЦ")
                .validFrom(LocalDateTime.now().minusMonths(6))
                .validTo(LocalDateTime.now().plusMonths(6))
                .thumbprint("ABC123")
                .subjectCn("CN=Иванов И.И.")
                .subjectOrg("ООО Привод")
                .subjectInn("7701234567")
                .subjectOgrn("1027700000001")
                .status(KepCertificateStatus.ACTIVE)
                .qualified(true)
                .build();
        activeCert.setId(certId);
        activeCert.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Certificate")
    class CreateCertificateTests {

        @Test
        @DisplayName("Should create certificate with ACTIVE status")
        void shouldCreateCertificate_whenValidInput() {
            CreateKepCertificateRequest request = new CreateKepCertificateRequest(
                    ownerId, "Иванов И.И.", "SN-002", "КриптоПро УЦ",
                    LocalDateTime.now().minusDays(1), LocalDateTime.now().plusYears(1),
                    "THUMB002", "CN=Иванов", "ООО Привод",
                    "7701234567", "1027700000001", "certdata", null);

            when(certificateRepository.save(any(KepCertificate.class))).thenAnswer(inv -> {
                KepCertificate c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            KepCertificateResponse response = kepService.createCertificate(request);

            assertThat(response.status()).isEqualTo(KepCertificateStatus.ACTIVE);
            assertThat(response.ownerName()).isEqualTo("Иванов И.И.");
            assertThat(response.qualified()).isTrue();
            verify(auditService).logCreate(eq("KepCertificate"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when validTo is before validFrom")
        void shouldThrowException_whenInvalidDateRange() {
            CreateKepCertificateRequest request = new CreateKepCertificateRequest(
                    ownerId, "Иванов И.И.", "SN-003", "КриптоПро УЦ",
                    LocalDateTime.now().plusYears(1), LocalDateTime.now().minusDays(1),
                    "THUMB003", null, null, null, null, null, null);

            assertThatThrownBy(() -> kepService.createCertificate(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания действия должна быть позже даты начала");
        }
    }

    @Nested
    @DisplayName("Revoke Certificate")
    class RevokeCertificateTests {

        @Test
        @DisplayName("Should revoke active certificate")
        void shouldRevokeCertificate_whenActive() {
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));
            when(certificateRepository.save(any(KepCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            KepCertificateResponse response = kepService.revokeCertificate(certId);

            assertThat(response.status()).isEqualTo(KepCertificateStatus.REVOKED);
            verify(auditService).logStatusChange("KepCertificate", certId, "ACTIVE", "REVOKED");
        }

        @Test
        @DisplayName("Should throw when revoking non-active certificate")
        void shouldThrowException_whenNotActive() {
            activeCert.setStatus(KepCertificateStatus.REVOKED);
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));

            assertThatThrownBy(() -> kepService.revokeCertificate(certId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Отозвать можно только действующий сертификат");
        }
    }

    @Nested
    @DisplayName("Sign Document")
    class SignDocumentTests {

        @Test
        @DisplayName("Should sign document with active certificate")
        void shouldSignDocument_whenCertificateActive() {
            UUID docId = UUID.randomUUID();
            SignDocumentRequest request = new SignDocumentRequest(
                    certId, "Contract", docId, "signature-data-base64",
                    "Иванов И.И.", "Директор");

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));
            when(signatureRepository.save(any(KepSignature.class))).thenAnswer(inv -> {
                KepSignature sig = inv.getArgument(0);
                sig.setId(UUID.randomUUID());
                sig.setCreatedAt(Instant.now());
                return sig;
            });

            KepSignatureResponse response = kepService.signDocument(request);

            assertThat(response.documentModel()).isEqualTo("Contract");
            assertThat(response.documentId()).isEqualTo(docId);
            assertThat(response.valid()).isTrue();
            assertThat(response.signatureHash()).isNotBlank();
            verify(auditService).logCreate(eq("KepSignature"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when signing with inactive certificate")
        void shouldThrowException_whenCertificateInactive() {
            activeCert.setStatus(KepCertificateStatus.REVOKED);
            UUID docId = UUID.randomUUID();
            SignDocumentRequest request = new SignDocumentRequest(
                    certId, "Contract", docId, "data", "Name", "Position");

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));

            assertThatThrownBy(() -> kepService.signDocument(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Сертификат не является действующим");
        }
    }

    @Nested
    @DisplayName("Verify Signature")
    class VerifySignatureTests {

        @Test
        @DisplayName("Should return valid signature when cert is active")
        void shouldReturnValid_whenSignatureAndCertAreValid() {
            UUID sigId = UUID.randomUUID();
            KepSignature signature = KepSignature.builder()
                    .certificateId(certId)
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .signedAt(LocalDateTime.now())
                    .signatureData("data")
                    .signatureHash("hash")
                    .valid(true)
                    .signerName("Иванов И.И.")
                    .build();
            signature.setId(sigId);

            when(signatureRepository.findById(sigId)).thenReturn(Optional.of(signature));
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));

            VerifySignatureResponse response = kepService.verifySignature(sigId);

            assertThat(response.valid()).isTrue();
            assertThat(response.validationMessage()).isEqualTo("Подпись действительна");
            assertThat(response.certificateSubject()).isEqualTo("CN=Иванов И.И.");
        }

        @Test
        @DisplayName("Should return invalid when certificate is revoked")
        void shouldReturnInvalid_whenCertificateRevoked() {
            UUID sigId = UUID.randomUUID();
            activeCert.setStatus(KepCertificateStatus.REVOKED);

            KepSignature signature = KepSignature.builder()
                    .certificateId(certId)
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .signedAt(LocalDateTime.now())
                    .signatureData("data")
                    .signatureHash("hash")
                    .valid(true)
                    .signerName("Иванов И.И.")
                    .build();
            signature.setId(sigId);

            when(signatureRepository.findById(sigId)).thenReturn(Optional.of(signature));
            when(certificateRepository.findById(certId)).thenReturn(Optional.of(activeCert));

            VerifySignatureResponse response = kepService.verifySignature(sigId);

            assertThat(response.valid()).isFalse();
            assertThat(response.validationMessage()).isEqualTo("Сертификат отозван");
        }

        @Test
        @DisplayName("Should return invalid when certificate is not found")
        void shouldReturnInvalid_whenCertificateNotFound() {
            UUID sigId = UUID.randomUUID();
            KepSignature signature = KepSignature.builder()
                    .certificateId(UUID.randomUUID())
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .signedAt(LocalDateTime.now())
                    .signatureData("data")
                    .signatureHash("hash")
                    .valid(true)
                    .signerName("Иванов И.И.")
                    .build();
            signature.setId(sigId);

            when(signatureRepository.findById(sigId)).thenReturn(Optional.of(signature));
            when(certificateRepository.findById(signature.getCertificateId())).thenReturn(Optional.empty());

            VerifySignatureResponse response = kepService.verifySignature(sigId);

            assertThat(response.valid()).isFalse();
            assertThat(response.validationMessage()).isEqualTo("Сертификат не найден");
        }
    }

    @Nested
    @DisplayName("Signing Requests")
    class SigningRequestTests {

        @Test
        @DisplayName("Should create signing request with PENDING status")
        void shouldCreateSigningRequest_whenValidInput() {
            UUID requesterId = UUID.randomUUID();
            UUID signerId = UUID.randomUUID();
            UUID docId = UUID.randomUUID();

            CreateSigningRequestRequest request = new CreateSigningRequestRequest(
                    "Contract", docId, "Договор подряда",
                    requesterId, signerId, LocalDate.now().plusDays(7), KepPriority.HIGH);

            when(signingRequestRepository.save(any(KepSigningRequest.class))).thenAnswer(inv -> {
                KepSigningRequest r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            KepSigningRequestResponse response = kepService.createSigningRequest(request);

            assertThat(response.status()).isEqualTo(KepSigningStatus.PENDING);
            assertThat(response.priority()).isEqualTo(KepPriority.HIGH);
            assertThat(response.documentTitle()).isEqualTo("Договор подряда");
            verify(auditService).logCreate(eq("KepSigningRequest"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default priority to NORMAL when null")
        void shouldDefaultPriority_whenNull() {
            CreateSigningRequestRequest request = new CreateSigningRequestRequest(
                    "Contract", UUID.randomUUID(), "Doc title",
                    UUID.randomUUID(), UUID.randomUUID(), null, null);

            when(signingRequestRepository.save(any(KepSigningRequest.class))).thenAnswer(inv -> {
                KepSigningRequest r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            KepSigningRequestResponse response = kepService.createSigningRequest(request);

            assertThat(response.priority()).isEqualTo(KepPriority.NORMAL);
        }

        @Test
        @DisplayName("Should complete signing request transitioning to SIGNED")
        void shouldCompleteSigningRequest_whenPending() {
            UUID requestId = UUID.randomUUID();
            UUID signatureId = UUID.randomUUID();

            KepSigningRequest signingRequest = KepSigningRequest.builder()
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .requesterId(UUID.randomUUID())
                    .signerId(UUID.randomUUID())
                    .status(KepSigningStatus.PENDING)
                    .priority(KepPriority.NORMAL)
                    .build();
            signingRequest.setId(requestId);
            signingRequest.setCreatedAt(Instant.now());

            when(signingRequestRepository.findById(requestId)).thenReturn(Optional.of(signingRequest));
            when(signingRequestRepository.save(any(KepSigningRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            KepSigningRequestResponse response = kepService.completeSigningRequest(requestId, signatureId);

            assertThat(response.status()).isEqualTo(KepSigningStatus.SIGNED);
            verify(auditService).logStatusChange("KepSigningRequest", requestId, "PENDING", "SIGNED");
        }

        @Test
        @DisplayName("Should throw when completing already processed request")
        void shouldThrowException_whenCompletingAlreadyProcessed() {
            UUID requestId = UUID.randomUUID();
            KepSigningRequest signingRequest = KepSigningRequest.builder()
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .requesterId(UUID.randomUUID())
                    .signerId(UUID.randomUUID())
                    .status(KepSigningStatus.SIGNED)
                    .priority(KepPriority.NORMAL)
                    .build();
            signingRequest.setId(requestId);

            when(signingRequestRepository.findById(requestId)).thenReturn(Optional.of(signingRequest));

            assertThatThrownBy(() -> kepService.completeSigningRequest(requestId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Запрос на подписание уже обработан");
        }

        @Test
        @DisplayName("Should reject signing request with reason")
        void shouldRejectSigningRequest_whenPending() {
            UUID requestId = UUID.randomUUID();
            KepSigningRequest signingRequest = KepSigningRequest.builder()
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .requesterId(UUID.randomUUID())
                    .signerId(UUID.randomUUID())
                    .status(KepSigningStatus.PENDING)
                    .priority(KepPriority.NORMAL)
                    .build();
            signingRequest.setId(requestId);
            signingRequest.setCreatedAt(Instant.now());

            when(signingRequestRepository.findById(requestId)).thenReturn(Optional.of(signingRequest));
            when(signingRequestRepository.save(any(KepSigningRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            KepSigningRequestResponse response = kepService.rejectSigningRequest(requestId, "Неверные данные документа");

            assertThat(response.status()).isEqualTo(KepSigningStatus.REJECTED);
            assertThat(response.rejectionReason()).isEqualTo("Неверные данные документа");
            verify(auditService).logStatusChange("KepSigningRequest", requestId, "PENDING", "REJECTED");
        }

        @Test
        @DisplayName("Should throw when rejecting already processed request")
        void shouldThrowException_whenRejectingAlreadyProcessed() {
            UUID requestId = UUID.randomUUID();
            KepSigningRequest signingRequest = KepSigningRequest.builder()
                    .documentModel("Contract")
                    .documentId(UUID.randomUUID())
                    .requesterId(UUID.randomUUID())
                    .signerId(UUID.randomUUID())
                    .status(KepSigningStatus.REJECTED)
                    .priority(KepPriority.NORMAL)
                    .build();
            signingRequest.setId(requestId);

            when(signingRequestRepository.findById(requestId)).thenReturn(Optional.of(signingRequest));

            assertThatThrownBy(() -> kepService.rejectSigningRequest(requestId, "reason"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Запрос на подписание уже обработан");
        }
    }
}
