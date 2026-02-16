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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KepService {

    private final KepCertificateRepository certificateRepository;
    private final KepSignatureRepository signatureRepository;
    private final KepSigningRequestRepository signingRequestRepository;
    private final AuditService auditService;

    // ===================== Certificates =====================

    @Transactional(readOnly = true)
    public Page<KepCertificateResponse> listCertificates(String search, UUID ownerId, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return certificateRepository.search(search, pageable).map(KepCertificateResponse::fromEntity);
        }
        if (ownerId != null) {
            return certificateRepository.findByOwnerIdAndDeletedFalse(ownerId, pageable)
                    .map(KepCertificateResponse::fromEntity);
        }
        return certificateRepository.findAll(pageable).map(KepCertificateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public KepCertificateResponse getCertificate(UUID id) {
        KepCertificate cert = getCertificateOrThrow(id);
        return KepCertificateResponse.fromEntity(cert);
    }

    @Transactional(readOnly = true)
    public List<KepCertificateResponse> getActiveCertificates(UUID ownerId) {
        return certificateRepository.findByOwnerIdAndStatusAndDeletedFalse(ownerId, KepCertificateStatus.ACTIVE)
                .stream()
                .map(KepCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public KepCertificateResponse createCertificate(CreateKepCertificateRequest request) {
        if (request.validTo().isBefore(request.validFrom())) {
            throw new IllegalArgumentException("Дата окончания действия должна быть позже даты начала");
        }

        KepCertificate cert = KepCertificate.builder()
                .ownerId(request.ownerId())
                .ownerName(request.ownerName())
                .serialNumber(request.serialNumber())
                .issuer(request.issuer())
                .validFrom(request.validFrom())
                .validTo(request.validTo())
                .thumbprint(request.thumbprint())
                .subjectCn(request.subjectCn())
                .subjectOrg(request.subjectOrg())
                .subjectInn(request.subjectInn())
                .subjectOgrn(request.subjectOgrn())
                .status(KepCertificateStatus.ACTIVE)
                .certificateData(request.certificateData())
                .qualified(request.qualified() != null ? request.qualified() : true)
                .build();

        cert = certificateRepository.save(cert);
        auditService.logCreate("KepCertificate", cert.getId());

        log.info("KEP certificate created: {} for {} ({})", cert.getSerialNumber(), cert.getOwnerName(), cert.getId());
        return KepCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public KepCertificateResponse updateCertificate(UUID id, CreateKepCertificateRequest request) {
        KepCertificate cert = getCertificateOrThrow(id);

        if (request.validTo().isBefore(request.validFrom())) {
            throw new IllegalArgumentException("Дата окончания действия должна быть позже даты начала");
        }

        cert.setOwnerName(request.ownerName());
        cert.setSerialNumber(request.serialNumber());
        cert.setIssuer(request.issuer());
        cert.setValidFrom(request.validFrom());
        cert.setValidTo(request.validTo());
        cert.setThumbprint(request.thumbprint());
        cert.setSubjectCn(request.subjectCn());
        cert.setSubjectOrg(request.subjectOrg());
        cert.setSubjectInn(request.subjectInn());
        cert.setSubjectOgrn(request.subjectOgrn());
        cert.setCertificateData(request.certificateData());
        if (request.qualified() != null) {
            cert.setQualified(request.qualified());
        }

        cert = certificateRepository.save(cert);
        auditService.logUpdate("KepCertificate", cert.getId(), "multiple", null, null);

        log.info("KEP certificate updated: {} for {} ({})", cert.getSerialNumber(), cert.getOwnerName(), cert.getId());
        return KepCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public void deleteCertificate(UUID id) {
        KepCertificate cert = getCertificateOrThrow(id);
        cert.softDelete();
        certificateRepository.save(cert);
        auditService.logDelete("KepCertificate", cert.getId());

        log.info("KEP certificate deleted: {} ({})", cert.getSerialNumber(), cert.getId());
    }

    @Transactional
    public KepCertificateResponse revokeCertificate(UUID id) {
        KepCertificate cert = getCertificateOrThrow(id);

        if (cert.getStatus() != KepCertificateStatus.ACTIVE) {
            throw new IllegalStateException("Отозвать можно только действующий сертификат");
        }

        KepCertificateStatus oldStatus = cert.getStatus();
        cert.setStatus(KepCertificateStatus.REVOKED);
        cert = certificateRepository.save(cert);
        auditService.logStatusChange("KepCertificate", cert.getId(), oldStatus.name(),
                KepCertificateStatus.REVOKED.name());

        log.info("KEP certificate revoked: {} ({})", cert.getSerialNumber(), cert.getId());
        return KepCertificateResponse.fromEntity(cert);
    }

    // ===================== Signing =====================

    @Transactional
    public KepSignatureResponse signDocument(SignDocumentRequest request) {
        KepCertificate cert = getCertificateOrThrow(request.certificateId());

        if (!cert.isActive()) {
            throw new IllegalStateException("Сертификат не является действующим");
        }

        String hash = computeHash(request.signatureData());

        KepSignature signature = KepSignature.builder()
                .certificateId(request.certificateId())
                .documentModel(request.documentModel())
                .documentId(request.documentId())
                .signedAt(LocalDateTime.now())
                .signatureData(request.signatureData())
                .signatureHash(hash)
                .valid(true)
                .signerName(request.signerName())
                .signerPosition(request.signerPosition())
                .build();

        signature = signatureRepository.save(signature);
        auditService.logCreate("KepSignature", signature.getId());

        log.info("Document signed: {} {} by cert {} ({})",
                request.documentModel(), request.documentId(), cert.getSerialNumber(), signature.getId());
        return KepSignatureResponse.fromEntity(signature);
    }

    @Transactional(readOnly = true)
    public VerifySignatureResponse verifySignature(UUID signatureId) {
        KepSignature sig = signatureRepository.findById(signatureId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Подпись не найдена: " + signatureId));

        KepCertificate cert = certificateRepository.findById(sig.getCertificateId()).orElse(null);
        String certSubject = cert != null ? cert.getSubjectCn() : null;

        boolean isValid = sig.isValid();
        String message = "Подпись действительна";

        if (cert == null) {
            isValid = false;
            message = "Сертификат не найден";
        } else if (cert.getStatus() == KepCertificateStatus.REVOKED) {
            isValid = false;
            message = "Сертификат отозван";
        } else if (cert.isExpired()) {
            message = "Сертификат истёк, но подпись была создана в период действия";
        }

        return new VerifySignatureResponse(
                sig.getId(),
                isValid,
                sig.getSignerName(),
                certSubject,
                sig.getSignedAt(),
                message
        );
    }

    @Transactional(readOnly = true)
    public List<KepSignatureResponse> getDocumentSignatures(String documentModel, UUID documentId) {
        return signatureRepository.findByDocumentModelAndDocumentIdAndDeletedFalse(documentModel, documentId)
                .stream()
                .map(KepSignatureResponse::fromEntity)
                .toList();
    }

    // ===================== Signing Requests =====================

    @Transactional
    public KepSigningRequestResponse createSigningRequest(CreateSigningRequestRequest request) {
        KepSigningRequest signingRequest = KepSigningRequest.builder()
                .documentModel(request.documentModel())
                .documentId(request.documentId())
                .documentTitle(request.documentTitle())
                .requesterId(request.requesterId())
                .signerId(request.signerId())
                .status(KepSigningStatus.PENDING)
                .dueDate(request.dueDate())
                .priority(request.priority() != null ? request.priority() : KepPriority.NORMAL)
                .build();

        signingRequest = signingRequestRepository.save(signingRequest);
        auditService.logCreate("KepSigningRequest", signingRequest.getId());

        log.info("Signing request created for {} {} -> signer {} ({})",
                request.documentModel(), request.documentId(), request.signerId(), signingRequest.getId());
        return KepSigningRequestResponse.fromEntity(signingRequest);
    }

    @Transactional(readOnly = true)
    public Page<KepSigningRequestResponse> listSigningRequests(UUID signerId, KepSigningStatus status,
                                                                 Pageable pageable) {
        if (signerId != null && status != null) {
            return signingRequestRepository.findBySignerIdAndStatusAndDeletedFalse(signerId, status, pageable)
                    .map(KepSigningRequestResponse::fromEntity);
        }
        if (signerId != null) {
            return signingRequestRepository.findBySignerIdAndDeletedFalse(signerId, pageable)
                    .map(KepSigningRequestResponse::fromEntity);
        }
        return signingRequestRepository.findAll(pageable).map(KepSigningRequestResponse::fromEntity);
    }

    @Transactional
    public KepSigningRequestResponse completeSigningRequest(UUID requestId, UUID signatureId) {
        KepSigningRequest request = getSigningRequestOrThrow(requestId);

        if (request.getStatus() != KepSigningStatus.PENDING) {
            throw new IllegalStateException("Запрос на подписание уже обработан");
        }

        request.setStatus(KepSigningStatus.SIGNED);
        request.setSignedAt(LocalDateTime.now());
        request = signingRequestRepository.save(request);
        auditService.logStatusChange("KepSigningRequest", request.getId(),
                KepSigningStatus.PENDING.name(), KepSigningStatus.SIGNED.name());

        log.info("Signing request completed: {} ({})", requestId, signatureId);
        return KepSigningRequestResponse.fromEntity(request);
    }

    @Transactional
    public KepSigningRequestResponse rejectSigningRequest(UUID requestId, String reason) {
        KepSigningRequest request = getSigningRequestOrThrow(requestId);

        if (request.getStatus() != KepSigningStatus.PENDING) {
            throw new IllegalStateException("Запрос на подписание уже обработан");
        }

        request.setStatus(KepSigningStatus.REJECTED);
        request.setRejectionReason(reason);
        request = signingRequestRepository.save(request);
        auditService.logStatusChange("KepSigningRequest", request.getId(),
                KepSigningStatus.PENDING.name(), KepSigningStatus.REJECTED.name());

        log.info("Signing request rejected: {} - {}", requestId, reason);
        return KepSigningRequestResponse.fromEntity(request);
    }

    @Transactional
    public void deleteSigningRequest(UUID id) {
        KepSigningRequest request = getSigningRequestOrThrow(id);
        request.softDelete();
        signingRequestRepository.save(request);
        auditService.logDelete("KepSigningRequest", request.getId());

        log.info("KEP signing request deleted: {}", request.getId());
    }

    // ===================== Helpers =====================

    private KepCertificate getCertificateOrThrow(UUID id) {
        return certificateRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сертификат КЭП не найден: " + id));
    }

    private KepSigningRequest getSigningRequestOrThrow(UUID id) {
        return signingRequestRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запрос на подписание не найден: " + id));
    }

    private String computeHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
