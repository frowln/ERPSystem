package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.QualityCertificate;
import com.privod.platform.modules.quality.repository.QualityCertificateRepository;
import com.privod.platform.modules.quality.web.dto.CreateQualityCertificateRequest;
import com.privod.platform.modules.quality.web.dto.QualityCertificateResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityCertificateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QualityCertificateService {

    private final QualityCertificateRepository certificateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<QualityCertificateResponse> listCertificates(UUID supplierId, UUID materialId, Pageable pageable) {
        if (supplierId != null) {
            return certificateRepository.findBySupplierIdAndDeletedFalse(supplierId, pageable)
                    .map(QualityCertificateResponse::fromEntity);
        }
        if (materialId != null) {
            return certificateRepository.findByMaterialIdAndDeletedFalse(materialId, pageable)
                    .map(QualityCertificateResponse::fromEntity);
        }
        return certificateRepository.findByDeletedFalse(pageable)
                .map(QualityCertificateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public QualityCertificateResponse getCertificate(UUID id) {
        QualityCertificate cert = getCertificateOrThrow(id);
        return QualityCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public QualityCertificateResponse createCertificate(CreateQualityCertificateRequest request) {
        QualityCertificate cert = QualityCertificate.builder()
                .materialId(request.materialId())
                .supplierId(request.supplierId())
                .supplierName(request.supplierName())
                .certificateNumber(request.certificateNumber())
                .issueDate(request.issueDate())
                .expiryDate(request.expiryDate())
                .certificateType(request.certificateType())
                .fileUrl(request.fileUrl())
                .isVerified(false)
                .build();

        cert = certificateRepository.save(cert);
        auditService.logCreate("QualityCertificate", cert.getId());

        log.info("Quality certificate created: {} - {} ({})",
                cert.getCertificateNumber(), cert.getCertificateType(), cert.getId());
        return QualityCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public QualityCertificateResponse updateCertificate(UUID id, UpdateQualityCertificateRequest request) {
        QualityCertificate cert = getCertificateOrThrow(id);

        if (request.materialId() != null) {
            cert.setMaterialId(request.materialId());
        }
        if (request.supplierId() != null) {
            cert.setSupplierId(request.supplierId());
        }
        if (request.supplierName() != null) {
            cert.setSupplierName(request.supplierName());
        }
        if (request.certificateNumber() != null) {
            cert.setCertificateNumber(request.certificateNumber());
        }
        if (request.issueDate() != null) {
            cert.setIssueDate(request.issueDate());
        }
        if (request.expiryDate() != null) {
            cert.setExpiryDate(request.expiryDate());
        }
        if (request.certificateType() != null) {
            cert.setCertificateType(request.certificateType());
        }
        if (request.fileUrl() != null) {
            cert.setFileUrl(request.fileUrl());
        }

        cert = certificateRepository.save(cert);
        auditService.logUpdate("QualityCertificate", cert.getId(), "multiple", null, null);

        log.info("Quality certificate updated: {} ({})", cert.getCertificateNumber(), cert.getId());
        return QualityCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public QualityCertificateResponse verifyCertificate(UUID id, UUID verifiedById) {
        QualityCertificate cert = getCertificateOrThrow(id);
        cert.setVerified(true);
        cert.setVerifiedById(verifiedById);

        cert = certificateRepository.save(cert);
        auditService.logUpdate("QualityCertificate", cert.getId(), "isVerified", "false", "true");

        log.info("Quality certificate verified: {} by {} ({})",
                cert.getCertificateNumber(), verifiedById, cert.getId());
        return QualityCertificateResponse.fromEntity(cert);
    }

    @Transactional(readOnly = true)
    public List<QualityCertificateResponse> getExpiredCertificates() {
        return certificateRepository.findExpiredCertificates(LocalDate.now())
                .stream()
                .map(QualityCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QualityCertificateResponse> getExpiringCertificates(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(daysAhead);
        return certificateRepository.findExpiringCertificates(today, warningDate)
                .stream()
                .map(QualityCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteCertificate(UUID id) {
        QualityCertificate cert = getCertificateOrThrow(id);
        cert.softDelete();
        certificateRepository.save(cert);
        auditService.logDelete("QualityCertificate", cert.getId());

        log.info("Quality certificate deleted: {} ({})", cert.getCertificateNumber(), cert.getId());
    }

    private QualityCertificate getCertificateOrThrow(UUID id) {
        return certificateRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сертификат качества не найден: " + id));
    }
}
