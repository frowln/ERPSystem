package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.ReconciliationAct;
import com.privod.platform.modules.finance.domain.ReconciliationActStatus;
import com.privod.platform.modules.finance.repository.ReconciliationActRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationActService {

    private final ReconciliationActRepository actRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ReconciliationAct> listActs(ReconciliationActStatus status, UUID counterpartyId,
                                             UUID contractId, Pageable pageable) {
        Specification<ReconciliationAct> spec = Specification.where(notDeleted());
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (counterpartyId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("counterpartyId"), counterpartyId));
        }
        if (contractId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("contractId"), contractId));
        }
        return actRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public ReconciliationAct getAct(UUID id) {
        return getActOrThrow(id);
    }

    @Transactional
    public ReconciliationAct createAct(ReconciliationAct act) {
        act.setStatus(ReconciliationActStatus.DRAFT);
        calculateBalances(act);
        act = actRepository.save(act);
        auditService.logCreate("ReconciliationAct", act.getId());
        log.info("Reconciliation act created: {} ({}) counterparty={}",
                act.getActNumber(), act.getId(), act.getCounterpartyId());
        return act;
    }

    @Transactional
    public ReconciliationAct updateAct(UUID id, ReconciliationAct updates) {
        ReconciliationAct act = getActOrThrow(id);
        if (act.getStatus() != ReconciliationActStatus.DRAFT) {
            throw new IllegalStateException("Редактирование акта сверки возможно только в статусе Черновик");
        }

        if (updates.getCounterpartyId() != null) act.setCounterpartyId(updates.getCounterpartyId());
        if (updates.getContractId() != null) act.setContractId(updates.getContractId());
        if (updates.getPeriodStart() != null) act.setPeriodStart(updates.getPeriodStart());
        if (updates.getPeriodEnd() != null) act.setPeriodEnd(updates.getPeriodEnd());
        if (updates.getOurDebit() != null) act.setOurDebit(updates.getOurDebit());
        if (updates.getOurCredit() != null) act.setOurCredit(updates.getOurCredit());
        if (updates.getCounterpartyDebit() != null) act.setCounterpartyDebit(updates.getCounterpartyDebit());
        if (updates.getCounterpartyCredit() != null) act.setCounterpartyCredit(updates.getCounterpartyCredit());
        if (updates.getNotes() != null) act.setNotes(updates.getNotes());

        calculateBalances(act);
        act = actRepository.save(act);
        auditService.logUpdate("ReconciliationAct", act.getId(), "multiple", null, null);
        log.info("Reconciliation act updated: {} ({})", act.getActNumber(), act.getId());
        return act;
    }

    @Transactional
    public ReconciliationAct sendAct(UUID id) {
        ReconciliationAct act = getActOrThrow(id);
        if (act.getStatus() != ReconciliationActStatus.DRAFT) {
            throw new IllegalStateException("Отправить можно только акт в статусе Черновик");
        }

        ReconciliationActStatus old = act.getStatus();
        act.setStatus(ReconciliationActStatus.SENT);
        act = actRepository.save(act);
        auditService.logStatusChange("ReconciliationAct", act.getId(), old.name(), ReconciliationActStatus.SENT.name());
        log.info("Reconciliation act sent: {} ({})", act.getActNumber(), act.getId());
        return act;
    }

    @Transactional
    public ReconciliationAct confirmAct(UUID id) {
        ReconciliationAct act = getActOrThrow(id);
        if (act.getStatus() != ReconciliationActStatus.SENT) {
            throw new IllegalStateException("Подтвердить можно только отправленный акт");
        }

        ReconciliationActStatus old = act.getStatus();
        if (act.getDiscrepancy().compareTo(BigDecimal.ZERO) != 0) {
            act.setStatus(ReconciliationActStatus.DISPUTED);
        } else {
            act.setStatus(ReconciliationActStatus.CONFIRMED);
        }
        act = actRepository.save(act);
        auditService.logStatusChange("ReconciliationAct", act.getId(), old.name(), act.getStatus().name());
        log.info("Reconciliation act confirmed: {} ({}) discrepancy={}",
                act.getActNumber(), act.getId(), act.getDiscrepancy());
        return act;
    }

    @Transactional
    public ReconciliationAct signAct(UUID id, boolean signedByUs, boolean signedByCounterparty) {
        ReconciliationAct act = getActOrThrow(id);
        if (act.getStatus() != ReconciliationActStatus.CONFIRMED
                && act.getStatus() != ReconciliationActStatus.DISPUTED) {
            throw new IllegalStateException("Подписать можно только подтверждённый или оспоренный акт");
        }

        act.setSignedByUs(signedByUs);
        act.setSignedByCounterparty(signedByCounterparty);
        if (signedByUs && signedByCounterparty) {
            act.setSignedDate(LocalDate.now());
            ReconciliationActStatus old = act.getStatus();
            act.setStatus(ReconciliationActStatus.SIGNED);
            auditService.logStatusChange("ReconciliationAct", act.getId(), old.name(), ReconciliationActStatus.SIGNED.name());
        }

        act = actRepository.save(act);
        log.info("Reconciliation act signed: {} ({}) us={} counterparty={}",
                act.getActNumber(), act.getId(), signedByUs, signedByCounterparty);
        return act;
    }

    @Transactional
    public void deleteAct(UUID id) {
        ReconciliationAct act = getActOrThrow(id);
        if (act.getStatus() != ReconciliationActStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только акт в статусе Черновик");
        }
        act.softDelete();
        actRepository.save(act);
        auditService.logDelete("ReconciliationAct", id);
        log.info("Reconciliation act deleted: {} ({})", act.getActNumber(), id);
    }

    private void calculateBalances(ReconciliationAct act) {
        act.setOurBalance(act.getOurDebit().subtract(act.getOurCredit()));
        act.setCounterpartyBalance(act.getCounterpartyDebit().subtract(act.getCounterpartyCredit()));
        act.setDiscrepancy(act.getOurBalance().subtract(act.getCounterpartyBalance()).abs());
    }

    private ReconciliationAct getActOrThrow(UUID id) {
        return actRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт сверки не найден: " + id));
    }

    private static Specification<ReconciliationAct> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }
}
