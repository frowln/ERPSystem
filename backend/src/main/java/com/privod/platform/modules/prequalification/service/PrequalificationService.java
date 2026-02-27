package com.privod.platform.modules.prequalification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.prequalification.domain.Prequalification;
import com.privod.platform.modules.prequalification.domain.PrequalificationStatus;
import com.privod.platform.modules.prequalification.repository.PrequalificationRepository;
import com.privod.platform.modules.prequalification.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.prequalification.web.dto.PrequalificationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class PrequalificationService {
    private final PrequalificationRepository repo;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PrequalificationResponse> list(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return repo.findByOrganizationIdAndDeletedFalse(orgId, pageable).map(PrequalificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PrequalificationResponse getById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return PrequalificationResponse.fromEntity(
            repo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Преквалификация не найдена: " + id)));
    }

    @Transactional
    public PrequalificationResponse create(CreatePrequalificationRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prequalification pq = Prequalification.builder()
            .organizationId(orgId)
            .companyName(req.companyName()).inn(req.inn()).counterpartyId(req.counterpartyId())
            .contactPerson(req.contactPerson()).contactEmail(req.contactEmail()).contactPhone(req.contactPhone())
            .workType(req.workType())
            .annualRevenue(req.annualRevenue()).yearsInBusiness(req.yearsInBusiness())
            .hasNoDebts(req.hasNoDebts()).hasCreditLine(req.hasCreditLine())
            .similarProjectsCount(req.similarProjectsCount()).maxProjectValue(req.maxProjectValue()).hasReferences(req.hasReferences())
            .hasSroMembership(req.hasSroMembership()).sroNumber(req.sroNumber())
            .hasIsoCertification(req.hasIsoCertification()).hasSafetyCertification(req.hasSafetyCertification())
            .ltir(req.ltir()).hasSafetyPlan(req.hasSafetyPlan()).noFatalIncidents3y(req.noFatalIncidents3y())
            .hasLiabilityInsurance(req.hasLiabilityInsurance()).insuranceCoverage(req.insuranceCoverage())
            .canProvideBankGuarantee(req.canProvideBankGuarantee())
            .employeeCount(req.employeeCount()).hasOwnEquipment(req.hasOwnEquipment()).hasOwnTransport(req.hasOwnTransport())
            .notes(req.notes())
            .status(PrequalificationStatus.PENDING)
            .build();
        pq.calculateScore();
        pq = repo.save(pq);
        auditService.logCreate("Prequalification", pq.getId());
        log.info("Преквалификация создана: {} (ИНН {}) — скор {}/20 → {}",
            pq.getCompanyName(), pq.getInn(), pq.getTotalScore(), pq.getQualificationResult());
        return PrequalificationResponse.fromEntity(pq);
    }

    @Transactional
    public PrequalificationResponse evaluate(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prequalification pq = repo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
            .orElseThrow(() -> new EntityNotFoundException("Преквалификация не найдена: " + id));
        pq.calculateScore();
        pq.setEvaluatedAt(LocalDate.now());
        pq.setStatus(pq.getTotalScore() >= 10 ? PrequalificationStatus.QUALIFIED : PrequalificationStatus.NOT_QUALIFIED);
        pq = repo.save(pq);
        auditService.logStatusChange("Prequalification", id, "PENDING", pq.getStatus().name());
        log.info("Преквалификация оценена: {} — {}/20 → {}", pq.getCompanyName(), pq.getTotalScore(), pq.getQualificationResult());
        return PrequalificationResponse.fromEntity(pq);
    }
}
