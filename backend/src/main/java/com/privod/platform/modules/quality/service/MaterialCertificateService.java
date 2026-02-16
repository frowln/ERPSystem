package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CertificateLine;
import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.repository.CertificateLineRepository;
import com.privod.platform.modules.quality.repository.MaterialCertificateRepository;
import com.privod.platform.modules.quality.web.dto.CertificateLineResponse;
import com.privod.platform.modules.quality.web.dto.CreateCertificateLineRequest;
import com.privod.platform.modules.quality.web.dto.CreateMaterialCertificateRequest;
import com.privod.platform.modules.quality.web.dto.MaterialCertificateResponse;
import com.privod.platform.modules.quality.web.dto.UpdateMaterialCertificateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialCertificateService {

    private final MaterialCertificateRepository certificateRepository;
    private final CertificateLineRepository lineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MaterialCertificateResponse> listCertificates(UUID materialId, MaterialCertificateStatus status, Pageable pageable) {
        if (materialId != null) {
            return certificateRepository.findByMaterialIdAndDeletedFalse(materialId, pageable)
                    .map(MaterialCertificateResponse::fromEntity);
        }
        if (status != null) {
            return certificateRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(MaterialCertificateResponse::fromEntity);
        }
        return certificateRepository.findByDeletedFalse(pageable)
                .map(MaterialCertificateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialCertificateResponse getCertificate(UUID id) {
        MaterialCertificate cert = getCertificateOrThrow(id);
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public MaterialCertificateResponse createCertificate(CreateMaterialCertificateRequest request) {
        MaterialCertificate cert = MaterialCertificate.builder()
                .materialId(request.materialId())
                .materialName(request.materialName())
                .certificateNumber(request.certificateNumber())
                .certificateType(request.certificateType())
                .issuedBy(request.issuedBy())
                .issuedDate(request.issuedDate())
                .expiryDate(request.expiryDate())
                .fileUrl(request.fileUrl())
                .status(MaterialCertificateStatus.PENDING_VERIFICATION)
                .notes(request.notes())
                .build();

        cert = certificateRepository.save(cert);
        auditService.logCreate("MaterialCertificate", cert.getId());

        log.info("Material certificate created: {} - {} ({})",
                cert.getCertificateNumber(), cert.getCertificateType(), cert.getId());
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public MaterialCertificateResponse updateCertificate(UUID id, UpdateMaterialCertificateRequest request) {
        MaterialCertificate cert = getCertificateOrThrow(id);

        if (request.materialId() != null) {
            cert.setMaterialId(request.materialId());
        }
        if (request.materialName() != null) {
            cert.setMaterialName(request.materialName());
        }
        if (request.certificateNumber() != null) {
            cert.setCertificateNumber(request.certificateNumber());
        }
        if (request.certificateType() != null) {
            cert.setCertificateType(request.certificateType());
        }
        if (request.issuedBy() != null) {
            cert.setIssuedBy(request.issuedBy());
        }
        if (request.issuedDate() != null) {
            cert.setIssuedDate(request.issuedDate());
        }
        if (request.expiryDate() != null) {
            cert.setExpiryDate(request.expiryDate());
        }
        if (request.fileUrl() != null) {
            cert.setFileUrl(request.fileUrl());
        }
        if (request.status() != null) {
            cert.setStatus(request.status());
        }
        if (request.notes() != null) {
            cert.setNotes(request.notes());
        }

        cert = certificateRepository.save(cert);
        auditService.logUpdate("MaterialCertificate", cert.getId(), "multiple", null, null);

        log.info("Material certificate updated: {} ({})", cert.getCertificateNumber(), cert.getId());
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public MaterialCertificateResponse verifyCertificate(UUID id, UUID verifiedById) {
        MaterialCertificate cert = getCertificateOrThrow(id);
        String oldStatus = cert.getStatus().name();

        cert.setStatus(MaterialCertificateStatus.VALID);
        cert.setVerifiedById(verifiedById);
        cert.setVerifiedAt(LocalDateTime.now());

        cert = certificateRepository.save(cert);
        auditService.logUpdate("MaterialCertificate", cert.getId(), "status", oldStatus, "VALID");

        log.info("Material certificate verified: {} by {} ({})",
                cert.getCertificateNumber(), verifiedById, cert.getId());
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional(readOnly = true)
    public List<MaterialCertificateResponse> getExpiredCertificates() {
        return certificateRepository.findExpiredCertificates(LocalDate.now())
                .stream()
                .map(MaterialCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MaterialCertificateResponse> getExpiringCertificates(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(daysAhead);
        return certificateRepository.findExpiringCertificates(today, warningDate)
                .stream()
                .map(MaterialCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteCertificate(UUID id) {
        MaterialCertificate cert = getCertificateOrThrow(id);
        cert.softDelete();
        certificateRepository.save(cert);
        auditService.logDelete("MaterialCertificate", cert.getId());

        log.info("Material certificate deleted: {} ({})", cert.getCertificateNumber(), cert.getId());
    }

    // --- Certificate Lines ---

    @Transactional(readOnly = true)
    public List<CertificateLineResponse> getLines(UUID certificateId) {
        getCertificateOrThrow(certificateId);
        return lineRepository.findByCertificateIdAndDeletedFalse(certificateId)
                .stream()
                .map(CertificateLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CertificateLineResponse addLine(UUID certificateId, CreateCertificateLineRequest request) {
        getCertificateOrThrow(certificateId);

        CertificateLine line = CertificateLine.builder()
                .certificateId(certificateId)
                .parameterName(request.parameterName())
                .standardValue(request.standardValue())
                .actualValue(request.actualValue())
                .unit(request.unit())
                .isCompliant(request.isCompliant() != null ? request.isCompliant() : true)
                .testMethod(request.testMethod())
                .build();

        line = lineRepository.save(line);
        auditService.logCreate("CertificateLine", line.getId());

        log.info("Certificate line added to certificate {}: {} ({})",
                certificateId, line.getParameterName(), line.getId());
        return CertificateLineResponse.fromEntity(line);
    }

    @Transactional
    public void removeLine(UUID lineId) {
        CertificateLine line = lineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка сертификата не найдена: " + lineId));
        line.softDelete();
        lineRepository.save(line);
        auditService.logDelete("CertificateLine", lineId);
        log.info("Certificate line removed: {}", lineId);
    }

    private MaterialCertificate getCertificateOrThrow(UUID id) {
        return certificateRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сертификат материала не найден: " + id));
    }
}
