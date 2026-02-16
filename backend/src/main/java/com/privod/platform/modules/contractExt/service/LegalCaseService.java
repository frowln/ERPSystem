package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.LegalCase;
import com.privod.platform.modules.contractExt.domain.LegalDocument;
import com.privod.platform.modules.contractExt.repository.ContractLegalCaseRepository;
import com.privod.platform.modules.contractExt.repository.LegalDocumentRepository;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalDocumentRequest;
import com.privod.platform.modules.contractExt.web.dto.LegalCaseResponse;
import com.privod.platform.modules.contractExt.web.dto.LegalDocumentResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalCaseService {

    private final ContractLegalCaseRepository caseRepository;
    private final LegalDocumentRepository documentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<LegalCaseResponse> listByProject(UUID projectId, Pageable pageable) {
        return caseRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(LegalCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<LegalCaseResponse> listByContract(UUID contractId, Pageable pageable) {
        return caseRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(LegalCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LegalCaseResponse getById(UUID id) {
        LegalCase legalCase = getCaseOrThrow(id);
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public LegalCaseResponse create(CreateLegalCaseRequest request) {
        LegalCase legalCase = LegalCase.builder()
                .projectId(request.projectId())
                .contractId(request.contractId())
                .caseNumber(request.caseNumber())
                .courtName(request.courtName())
                .title(request.title())
                .description(request.description())
                .caseType(request.caseType())
                .amount(request.amount())
                .currency(request.currency())
                .status(CaseStatus.OPEN)
                .filingDate(request.filingDate())
                .hearingDate(request.hearingDate())
                .responsibleId(request.responsibleId())
                .lawyerId(request.lawyerId())
                .build();

        legalCase = caseRepository.save(legalCase);
        auditService.logCreate("LegalCase", legalCase.getId());

        log.info("Legal case created: {} ({})", legalCase.getCaseNumber(), legalCase.getId());
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public LegalCaseResponse changeStatus(UUID id, CaseStatus newStatus) {
        LegalCase legalCase = getCaseOrThrow(id);
        CaseStatus oldStatus = legalCase.getStatus();

        legalCase.setStatus(newStatus);
        legalCase = caseRepository.save(legalCase);

        auditService.logStatusChange("LegalCase", legalCase.getId(), oldStatus.name(), newStatus.name());

        log.info("Legal case status changed: {} from {} to {} ({})",
                legalCase.getCaseNumber(), oldStatus, newStatus, legalCase.getId());
        return LegalCaseResponse.fromEntity(legalCase);
    }

    // -- Documents --

    @Transactional(readOnly = true)
    public List<LegalDocumentResponse> listDocuments(UUID caseId) {
        return documentRepository.findByCaseIdAndDeletedFalseOrderByUploadedAtDesc(caseId)
                .stream()
                .map(LegalDocumentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LegalDocumentResponse createDocument(CreateLegalDocumentRequest request) {
        getCaseOrThrow(request.caseId());

        LegalDocument document = LegalDocument.builder()
                .caseId(request.caseId())
                .title(request.title())
                .documentType(request.documentType())
                .fileUrl(request.fileUrl())
                .uploadedById(request.uploadedById())
                .uploadedAt(Instant.now())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("LegalDocument", document.getId());

        log.info("Legal document created: {} for case {}", document.getTitle(), request.caseId());
        return LegalDocumentResponse.fromEntity(document);
    }

    private LegalCase getCaseOrThrow(UUID id) {
        return caseRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Судебное дело не найдено: " + id));
    }
}
