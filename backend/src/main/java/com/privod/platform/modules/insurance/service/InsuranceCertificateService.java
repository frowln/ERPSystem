package com.privod.platform.modules.insurance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.insurance.domain.CertificateType;
import com.privod.platform.modules.insurance.domain.InsuranceCertificate;
import com.privod.platform.modules.insurance.domain.InsuranceCertificateStatus;
import com.privod.platform.modules.insurance.repository.InsuranceCertificateRepository;
import com.privod.platform.modules.insurance.web.dto.CreateInsuranceCertificateRequest;
import com.privod.platform.modules.insurance.web.dto.InsuranceCertificateResponse;
import com.privod.platform.modules.insurance.web.dto.UpdateInsuranceCertificateRequest;
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
public class InsuranceCertificateService {

    private final InsuranceCertificateRepository repo;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InsuranceCertificateResponse> list(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return repo.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(InsuranceCertificateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public InsuranceCertificateResponse getById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return InsuranceCertificateResponse.fromEntity(
            repo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Insurance certificate not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<InsuranceCertificateResponse> getExpiring(int days) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate now = LocalDate.now();
        LocalDate cutoff = now.plusDays(days);
        return repo.findExpiring(orgId, now, cutoff).stream()
                .map(InsuranceCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InsuranceCertificateResponse> getByVendor(UUID vendorId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return repo.findByOrganizationIdAndVendorIdAndDeletedFalse(orgId, vendorId).stream()
                .map(InsuranceCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public InsuranceCertificateResponse create(CreateInsuranceCertificateRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        InsuranceCertificate cert = InsuranceCertificate.builder()
                .organizationId(orgId)
                .vendorId(req.vendorId())
                .vendorName(req.vendorName())
                .certificateType(CertificateType.valueOf(req.certificateType()))
                .policyNumber(req.policyNumber())
                .insurerName(req.insurerName())
                .coverageAmount(req.coverageAmount())
                .deductible(req.deductible())
                .effectiveDate(req.effectiveDate() != null ? LocalDate.parse(req.effectiveDate()) : null)
                .expiryDate(req.expiryDate() != null ? LocalDate.parse(req.expiryDate()) : null)
                .certificateHolder(req.certificateHolder())
                .status(req.status() != null ? InsuranceCertificateStatus.valueOf(req.status()) : InsuranceCertificateStatus.PENDING)
                .storagePath(req.storagePath())
                .notes(req.notes())
                .build();
        cert = repo.save(cert);
        auditService.logCreate("InsuranceCertificate", cert.getId());
        log.info("Insurance certificate created: {} for vendor {}", cert.getId(), cert.getVendorName());
        return InsuranceCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public InsuranceCertificateResponse update(UUID id, UpdateInsuranceCertificateRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        InsuranceCertificate cert = repo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Insurance certificate not found: " + id));

        if (req.vendorId() != null) cert.setVendorId(req.vendorId());
        if (req.vendorName() != null) cert.setVendorName(req.vendorName());
        if (req.certificateType() != null) cert.setCertificateType(CertificateType.valueOf(req.certificateType()));
        if (req.policyNumber() != null) cert.setPolicyNumber(req.policyNumber());
        if (req.insurerName() != null) cert.setInsurerName(req.insurerName());
        if (req.coverageAmount() != null) cert.setCoverageAmount(req.coverageAmount());
        if (req.deductible() != null) cert.setDeductible(req.deductible());
        if (req.effectiveDate() != null) cert.setEffectiveDate(LocalDate.parse(req.effectiveDate()));
        if (req.expiryDate() != null) cert.setExpiryDate(LocalDate.parse(req.expiryDate()));
        if (req.certificateHolder() != null) cert.setCertificateHolder(req.certificateHolder());
        if (req.status() != null) cert.setStatus(InsuranceCertificateStatus.valueOf(req.status()));
        if (req.storagePath() != null) cert.setStoragePath(req.storagePath());
        if (req.notes() != null) cert.setNotes(req.notes());

        cert = repo.save(cert);
        auditService.logUpdate("InsuranceCertificate", id, "update", null, cert.getVendorName());
        log.info("Insurance certificate updated: {}", cert.getId());
        return InsuranceCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public void softDelete(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        InsuranceCertificate cert = repo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Insurance certificate not found: " + id));
        cert.softDelete();
        repo.save(cert);
        auditService.logStatusChange("InsuranceCertificate", id, cert.getStatus().name(), "DELETED");
        log.info("Insurance certificate soft-deleted: {}", id);
    }
}
