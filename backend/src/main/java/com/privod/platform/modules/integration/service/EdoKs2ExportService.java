package com.privod.platform.modules.integration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks3DocumentRepository;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.integration.domain.SbisDirection;
import com.privod.platform.modules.integration.domain.SbisDocument;
import com.privod.platform.modules.integration.domain.SbisDocumentStatus;
import com.privod.platform.modules.integration.domain.SbisDocumentType;
import com.privod.platform.modules.integration.domain.SbisPartnerMapping;
import com.privod.platform.modules.integration.repository.SbisDocumentRepository;
import com.privod.platform.modules.integration.repository.SbisPartnerMappingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EdoKs2ExportService {

    private final Ks2DocumentRepository ks2Repository;
    private final Ks3DocumentRepository ks3Repository;
    private final ContractRepository contractRepository;
    private final SbisDocumentRepository sbisDocumentRepository;
    private final SbisPartnerMappingRepository partnerMappingRepository;
    private final SbisService sbisService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ─── Inner DTOs ──────────────────────────────────────────────────────────

    public record EdoSendResult(UUID sbisDocumentId, String status, String message) {}

    public record EdoStatusResult(String status, Instant deliveredAt, Instant signedAt, String message) {}

    // ─── Send KS-2 to EDO ────────────────────────────────────────────────────

    @Transactional
    public EdoSendResult sendKs2ToEdo(UUID ks2Id) {
        Ks2Document ks2 = ks2Repository.findById(ks2Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ КС-2 не найден: " + ks2Id));

        // Validate: document must be signed
        if (ks2.getStatus() != ClosingDocumentStatus.SIGNED && ks2.getStatus() != ClosingDocumentStatus.CLOSED) {
            throw new IllegalStateException(
                    "Документ КС-2 должен быть подписан для отправки в ЭДО. Текущий статус: "
                            + ks2.getStatus().getDisplayName());
        }

        // Prevent duplicate sends
        if (ks2.getEdoDocumentId() != null && !"NONE".equals(ks2.getEdoStatus())) {
            throw new IllegalStateException(
                    "Документ КС-2 уже отправлен в ЭДО. Статус ЭДО: " + ks2.getEdoStatus());
        }

        // Resolve partner INN/KPP from contract
        String partnerInn = null;
        String partnerKpp = null;
        String partnerName = null;
        if (ks2.getContractId() != null) {
            Contract contract = contractRepository.findByIdAndDeletedFalse(ks2.getContractId()).orElse(null);
            if (contract != null && contract.getPartnerId() != null) {
                partnerName = contract.getPartnerName();
                SbisPartnerMapping mapping = partnerMappingRepository
                        .findByPartnerIdAndDeletedFalse(contract.getPartnerId())
                        .orElse(null);
                if (mapping != null) {
                    partnerInn = mapping.getSbisContractorInn();
                    partnerKpp = mapping.getSbisContractorKpp();
                    partnerName = mapping.getPartnerName();
                }
            }
        }

        // Build document data JSON
        Map<String, Object> docData = new HashMap<>();
        docData.put("documentType", "KS-2");
        docData.put("number", ks2.getNumber());
        docData.put("date", ks2.getDocumentDate().toString());
        docData.put("amount", ks2.getTotalAmount());
        docData.put("amountWithVat", ks2.getTotalWithVat());
        docData.put("vatAmount", ks2.getTotalVatAmount());
        docData.put("internalId", ks2Id.toString());

        String documentData;
        try {
            documentData = objectMapper.writeValueAsString(docData);
        } catch (JsonProcessingException e) {
            documentData = "{}";
        }

        // Create SbisDocument record
        SbisDocument sbisDoc = SbisDocument.builder()
                .documentType(SbisDocumentType.ACT)
                .internalDocumentId(ks2Id)
                .internalDocumentModel("Ks2Document")
                .partnerInn(partnerInn)
                .partnerKpp(partnerKpp)
                .partnerName(partnerName)
                .direction(SbisDirection.OUTGOING)
                .status(SbisDocumentStatus.DRAFT)
                .documentData(documentData)
                .build();

        sbisDoc = sbisDocumentRepository.save(sbisDoc);

        // Transition to SENT via SbisService
        sbisService.sendDocument(sbisDoc.getId());

        // Update KS-2 with EDO tracking info
        ks2.setEdoDocumentId(sbisDoc.getId());
        ks2.setEdoStatus("SENT");
        ks2.setEdoSentAt(Instant.now());
        ks2Repository.save(ks2);

        auditService.logStatusChange("Ks2Document", ks2Id, "edoStatus", "SENT");
        log.info("КС-2 {} отправлен в ЭДО, sbisDocId={}", ks2.getNumber(), sbisDoc.getId());

        return new EdoSendResult(sbisDoc.getId(), "SENT", "Документ КС-2 успешно отправлен в ЭДО");
    }

    // ─── Send KS-3 to EDO ────────────────────────────────────────────────────

    @Transactional
    public EdoSendResult sendKs3ToEdo(UUID ks3Id) {
        Ks3Document ks3 = ks3Repository.findById(ks3Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ КС-3 не найден: " + ks3Id));

        // Validate: document must be signed
        if (ks3.getStatus() != ClosingDocumentStatus.SIGNED && ks3.getStatus() != ClosingDocumentStatus.CLOSED) {
            throw new IllegalStateException(
                    "Документ КС-3 должен быть подписан для отправки в ЭДО. Текущий статус: "
                            + ks3.getStatus().getDisplayName());
        }

        // Prevent duplicate sends
        if (ks3.getEdoDocumentId() != null && !"NONE".equals(ks3.getEdoStatus())) {
            throw new IllegalStateException(
                    "Документ КС-3 уже отправлен в ЭДО. Статус ЭДО: " + ks3.getEdoStatus());
        }

        // Resolve partner INN/KPP from contract
        String partnerInn = null;
        String partnerKpp = null;
        String partnerName = null;
        if (ks3.getContractId() != null) {
            Contract contract = contractRepository.findByIdAndDeletedFalse(ks3.getContractId()).orElse(null);
            if (contract != null && contract.getPartnerId() != null) {
                partnerName = contract.getPartnerName();
                SbisPartnerMapping mapping = partnerMappingRepository
                        .findByPartnerIdAndDeletedFalse(contract.getPartnerId())
                        .orElse(null);
                if (mapping != null) {
                    partnerInn = mapping.getSbisContractorInn();
                    partnerKpp = mapping.getSbisContractorKpp();
                    partnerName = mapping.getPartnerName();
                }
            }
        }

        // Build document data JSON
        Map<String, Object> docData = new HashMap<>();
        docData.put("documentType", "KS-3");
        docData.put("number", ks3.getNumber());
        docData.put("date", ks3.getDocumentDate().toString());
        docData.put("totalAmount", ks3.getTotalAmount());
        docData.put("netAmount", ks3.getNetAmount());
        docData.put("retentionAmount", ks3.getRetentionAmount());
        if (ks3.getPeriodFrom() != null) {
            docData.put("periodFrom", ks3.getPeriodFrom().toString());
        }
        if (ks3.getPeriodTo() != null) {
            docData.put("periodTo", ks3.getPeriodTo().toString());
        }
        docData.put("internalId", ks3Id.toString());

        String documentData;
        try {
            documentData = objectMapper.writeValueAsString(docData);
        } catch (JsonProcessingException e) {
            documentData = "{}";
        }

        // Create SbisDocument record
        SbisDocument sbisDoc = SbisDocument.builder()
                .documentType(SbisDocumentType.ACT)
                .internalDocumentId(ks3Id)
                .internalDocumentModel("Ks3Document")
                .partnerInn(partnerInn)
                .partnerKpp(partnerKpp)
                .partnerName(partnerName)
                .direction(SbisDirection.OUTGOING)
                .status(SbisDocumentStatus.DRAFT)
                .documentData(documentData)
                .build();

        sbisDoc = sbisDocumentRepository.save(sbisDoc);

        // Transition to SENT
        sbisService.sendDocument(sbisDoc.getId());

        // Update KS-3 with EDO tracking info
        ks3.setEdoDocumentId(sbisDoc.getId());
        ks3.setEdoStatus("SENT");
        ks3.setEdoSentAt(Instant.now());
        ks3Repository.save(ks3);

        auditService.logStatusChange("Ks3Document", ks3Id, "edoStatus", "SENT");
        log.info("КС-3 {} отправлен в ЭДО, sbisDocId={}", ks3.getNumber(), sbisDoc.getId());

        return new EdoSendResult(sbisDoc.getId(), "SENT", "Документ КС-3 успешно отправлен в ЭДО");
    }

    // ─── Check delivery status ───────────────────────────────────────────────

    @Transactional
    public EdoStatusResult checkDeliveryStatus(UUID sbisDocId) {
        SbisDocument sbisDoc = sbisDocumentRepository.findById(sbisDocId)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ СБИС не найден: " + sbisDocId));

        // In production, this would call the SBIS API to check real delivery status.
        // For now, we simulate status progression based on current state.
        SbisDocumentStatus currentStatus = sbisDoc.getStatus();
        Instant now = Instant.now();

        if (currentStatus == SbisDocumentStatus.SENT) {
            // Simulate: SENT -> DELIVERED
            sbisDoc.setStatus(SbisDocumentStatus.DELIVERED);
            sbisDoc.setReceivedAt(now);
            sbisDocumentRepository.save(sbisDoc);
            auditService.logStatusChange("SbisDocument", sbisDocId, "SENT", "DELIVERED");

            updateSourceDocumentEdoStatus(sbisDoc, "DELIVERED", now, null);
            log.info("Документ СБИС {} доставлен", sbisDocId);
            return new EdoStatusResult("DELIVERED", now, null, "Документ доставлен контрагенту");
        }

        if (currentStatus == SbisDocumentStatus.DELIVERED) {
            // Simulate: DELIVERED -> ACCEPTED
            sbisDoc.setStatus(SbisDocumentStatus.ACCEPTED);
            sbisDoc.setSignedAt(now);
            sbisDocumentRepository.save(sbisDoc);
            auditService.logStatusChange("SbisDocument", sbisDocId, "DELIVERED", "ACCEPTED");

            updateSourceDocumentEdoStatus(sbisDoc, "ACCEPTED", sbisDoc.getReceivedAt(), now);
            log.info("Документ СБИС {} принят контрагентом", sbisDocId);
            return new EdoStatusResult("ACCEPTED", sbisDoc.getReceivedAt(), now,
                    "Документ принят и подписан контрагентом");
        }

        // Already in terminal state
        return new EdoStatusResult(
                currentStatus.name(),
                sbisDoc.getReceivedAt(),
                sbisDoc.getSignedAt(),
                "Текущий статус: " + currentStatus.getDisplayName()
        );
    }

    // ─── Receive inbound document (webhook) ──────────────────────────────────

    @Transactional
    public SbisDocument receiveInboundDocument(Map<String, Object> payload) {
        String externalId = (String) payload.getOrDefault("externalId", UUID.randomUUID().toString());
        String docTypeName = (String) payload.getOrDefault("documentType", "ACT");
        String partnerInn = (String) payload.get("partnerInn");
        String partnerKpp = (String) payload.get("partnerKpp");
        String partnerName = (String) payload.get("partnerName");

        SbisDocumentType docType;
        try {
            docType = SbisDocumentType.valueOf(docTypeName);
        } catch (IllegalArgumentException e) {
            docType = SbisDocumentType.ACT;
        }

        String documentData;
        try {
            documentData = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            documentData = "{}";
        }

        SbisDocument inbound = SbisDocument.builder()
                .sbisId(externalId)
                .documentType(docType)
                .partnerInn(partnerInn)
                .partnerKpp(partnerKpp)
                .partnerName(partnerName)
                .direction(SbisDirection.INCOMING)
                .status(SbisDocumentStatus.DELIVERED)
                .receivedAt(Instant.now())
                .documentData(documentData)
                .build();

        inbound = sbisDocumentRepository.save(inbound);
        auditService.logCreate("SbisDocument", inbound.getId());

        log.info("Входящий документ ЭДО получен: sbisId={}, type={}, partner={}",
                externalId, docType, partnerName);

        return inbound;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private void updateSourceDocumentEdoStatus(SbisDocument sbisDoc, String edoStatus,
                                                Instant deliveredAt, Instant signedAt) {
        if (sbisDoc.getInternalDocumentId() == null) return;

        UUID internalId = sbisDoc.getInternalDocumentId();
        String model = sbisDoc.getInternalDocumentModel();

        if ("Ks2Document".equals(model)) {
            ks2Repository.findById(internalId).ifPresent(ks2 -> {
                ks2.setEdoStatus(edoStatus);
                if (deliveredAt != null) ks2.setEdoDeliveredAt(deliveredAt);
                if (signedAt != null) ks2.setEdoSignedAt(signedAt);
                ks2Repository.save(ks2);
                auditService.logStatusChange("Ks2Document", internalId, "edoStatus", edoStatus);
            });
        } else if ("Ks3Document".equals(model)) {
            ks3Repository.findById(internalId).ifPresent(ks3 -> {
                ks3.setEdoStatus(edoStatus);
                if (deliveredAt != null) ks3.setEdoDeliveredAt(deliveredAt);
                if (signedAt != null) ks3.setEdoSignedAt(signedAt);
                ks3Repository.save(ks3);
                auditService.logStatusChange("Ks3Document", internalId, "edoStatus", edoStatus);
            });
        }
    }
}
