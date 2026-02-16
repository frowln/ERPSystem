package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.pto.repository.PtoMaterialCertificateRepository;
import com.privod.platform.modules.pto.web.dto.CreateMaterialCertificateRequest;
import com.privod.platform.modules.pto.web.dto.MaterialCertificateResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PtoMaterialCertificateService {

    private final PtoMaterialCertificateRepository certificateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MaterialCertificateResponse> listCertificates(UUID materialId, Pageable pageable) {
        return certificateRepository.findByMaterialIdAndDeletedFalse(materialId, pageable)
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
                .notes(request.notes())
                .build();

        cert = certificateRepository.save(cert);
        auditService.logCreate("MaterialCertificate", cert.getId());

        log.info("Material certificate created: {} ({}) for material {}",
                cert.getCertificateNumber(), cert.getId(), request.materialName());
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public MaterialCertificateResponse invalidateCertificate(UUID id) {
        MaterialCertificate cert = getCertificateOrThrow(id);
        String oldStatus = cert.getStatus().name();
        cert.setStatus(MaterialCertificateStatus.REVOKED);
        cert = certificateRepository.save(cert);
        auditService.logStatusChange("MaterialCertificate", cert.getId(), oldStatus, "REVOKED");

        log.info("Material certificate invalidated: {} ({})", cert.getCertificateNumber(), id);
        return MaterialCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public void deleteCertificate(UUID id) {
        MaterialCertificate cert = getCertificateOrThrow(id);
        cert.softDelete();
        certificateRepository.save(cert);
        auditService.logDelete("MaterialCertificate", id);
        log.info("Material certificate deleted: {} ({})", cert.getCertificateNumber(), id);
    }

    private MaterialCertificate getCertificateOrThrow(UUID id) {
        return certificateRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сертификат материала не найден: " + id));
    }
}
