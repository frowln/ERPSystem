package com.privod.platform.modules.russianDoc.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.russianDoc.domain.Act;
import com.privod.platform.modules.russianDoc.domain.InventoryAct;
import com.privod.platform.modules.russianDoc.domain.PowerOfAttorney;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.SchetFaktura;
import com.privod.platform.modules.russianDoc.domain.Torg12;
import com.privod.platform.modules.russianDoc.domain.Upd;
import com.privod.platform.modules.russianDoc.domain.Waybill;
import com.privod.platform.modules.russianDoc.domain.WriteOffAct;
import com.privod.platform.modules.russianDoc.repository.ActRepository;
import com.privod.platform.modules.russianDoc.repository.InventoryActRepository;
import com.privod.platform.modules.russianDoc.repository.PowerOfAttorneyRepository;
import com.privod.platform.modules.russianDoc.repository.SchetFakturaRepository;
import com.privod.platform.modules.russianDoc.repository.Torg12Repository;
import com.privod.platform.modules.russianDoc.repository.UpdRepository;
import com.privod.platform.modules.russianDoc.repository.WaybillRepository;
import com.privod.platform.modules.russianDoc.repository.WriteOffActRepository;
import com.privod.platform.modules.russianDoc.web.dto.ChangeRussianDocStatusRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateUpdRequest;
import com.privod.platform.modules.russianDoc.web.dto.UpdResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RussianDocService {

    private final UpdRepository updRepository;
    private final Torg12Repository torg12Repository;
    private final SchetFakturaRepository schetFakturaRepository;
    private final ActRepository actRepository;
    private final PowerOfAttorneyRepository poaRepository;
    private final WaybillRepository waybillRepository;
    private final InventoryActRepository inventoryActRepository;
    private final WriteOffActRepository writeOffActRepository;
    private final AuditService auditService;

    // ============================
    // UPD (Универсальный передаточный документ)
    // ============================

    @Transactional(readOnly = true)
    public Page<UpdResponse> listUpd(UUID projectId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Page<Upd> page = projectId != null
                ? updRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(currentOrgId, projectId, pageable)
                : updRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, pageable);
        return page.map(UpdResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public UpdResponse getUpd(UUID id) {
        Upd upd = getUpdOrThrow(id);
        return UpdResponse.fromEntity(upd);
    }

    @Transactional
    public UpdResponse createUpd(CreateUpdRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create UPD in another organization");
        }

        Upd upd = Upd.builder()
                .number(request.number())
                .date(request.date())
                .sellerId(request.sellerId())
                .buyerId(request.buyerId())
                .items(request.items() != null ? request.items() : "[]")
                .totalAmount(request.totalAmount() != null ? request.totalAmount() : BigDecimal.ZERO)
                .vatAmount(request.vatAmount() != null ? request.vatAmount() : BigDecimal.ZERO)
                .status(RussianDocStatus.DRAFT)
                .organizationId(currentOrgId)
                .projectId(request.projectId())
                .build();

        upd = updRepository.save(upd);
        auditService.logCreate("Upd", upd.getId());

        log.info("УПД создан: {} ({})", upd.getNumber(), upd.getId());
        return UpdResponse.fromEntity(upd);
    }

    @Transactional
    public UpdResponse updateUpd(UUID id, CreateUpdRequest request) {
        Upd upd = getUpdOrThrow(id);
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot move UPD to another organization");
        }

        upd.setNumber(request.number());
        upd.setDate(request.date());
        upd.setSellerId(request.sellerId());
        upd.setBuyerId(request.buyerId());
        upd.setItems(request.items() != null ? request.items() : "[]");
        upd.setTotalAmount(request.totalAmount() != null ? request.totalAmount() : BigDecimal.ZERO);
        upd.setVatAmount(request.vatAmount() != null ? request.vatAmount() : BigDecimal.ZERO);
        upd.setOrganizationId(currentOrgId);
        upd.setProjectId(request.projectId());

        upd = updRepository.save(upd);
        auditService.logUpdate("Upd", upd.getId(), "multiple", null, null);

        log.info("УПД обновлён: {} ({})", upd.getNumber(), upd.getId());
        return UpdResponse.fromEntity(upd);
    }

    @Transactional
    public void deleteUpd(UUID id) {
        Upd upd = getUpdOrThrow(id);
        upd.softDelete();
        updRepository.save(upd);
        auditService.logDelete("Upd", upd.getId());

        log.info("УПД удалён: {} ({})", upd.getNumber(), upd.getId());
    }

    @Transactional
    public UpdResponse changeUpdStatus(UUID id, ChangeRussianDocStatusRequest request) {
        Upd upd = getUpdOrThrow(id);
        RussianDocStatus oldStatus = upd.getStatus();
        RussianDocStatus newStatus = request.status();

        if (!upd.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести УПД из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        upd.setStatus(newStatus);
        upd = updRepository.save(upd);
        auditService.logStatusChange("Upd", upd.getId(), oldStatus.name(), newStatus.name());

        log.info("Статус УПД изменён: {} {} -> {} ({})",
                upd.getNumber(), oldStatus, newStatus, upd.getId());
        return UpdResponse.fromEntity(upd);
    }

    private Upd getUpdOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return updRepository.findByIdAndOrganizationIdAndDeletedFalse(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("УПД не найден: " + id));
    }

    // ============================
    // TORG12
    // ============================

    @Transactional(readOnly = true)
    public Page<Torg12> listTorg12(UUID projectId, Pageable pageable) {
        return projectId != null
                ? torg12Repository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : torg12Repository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public Torg12 getTorg12(UUID id) {
        return torg12Repository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ТОРГ-12 не найден: " + id));
    }

    // ============================
    // Schet-Faktura
    // ============================

    @Transactional(readOnly = true)
    public Page<SchetFaktura> listSchetFaktura(UUID projectId, Pageable pageable) {
        return projectId != null
                ? schetFakturaRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : schetFakturaRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public SchetFaktura getSchetFaktura(UUID id) {
        return schetFakturaRepository.findById(id)
                .filter(sf -> !sf.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Счёт-фактура не найден: " + id));
    }

    // ============================
    // Act (Акт выполненных работ)
    // ============================

    @Transactional(readOnly = true)
    public Page<Act> listActs(UUID projectId, Pageable pageable) {
        return projectId != null
                ? actRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : actRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public Act getAct(UUID id) {
        return actRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт не найден: " + id));
    }

    // ============================
    // PowerOfAttorney (Доверенность М-2)
    // ============================

    @Transactional(readOnly = true)
    public Page<PowerOfAttorney> listPowerOfAttorneys(UUID projectId, Pageable pageable) {
        return projectId != null
                ? poaRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : poaRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public PowerOfAttorney getPowerOfAttorney(UUID id) {
        return poaRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Доверенность не найдена: " + id));
    }

    // ============================
    // Waybill (ТТН)
    // ============================

    @Transactional(readOnly = true)
    public Page<Waybill> listWaybills(UUID projectId, Pageable pageable) {
        return projectId != null
                ? waybillRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : waybillRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public Waybill getWaybill(UUID id) {
        return waybillRepository.findById(id)
                .filter(w -> !w.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ТТН не найдена: " + id));
    }

    // ============================
    // InventoryAct (Инвентаризационная ведомость)
    // ============================

    @Transactional(readOnly = true)
    public Page<InventoryAct> listInventoryActs(UUID projectId, Pageable pageable) {
        return projectId != null
                ? inventoryActRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : inventoryActRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public InventoryAct getInventoryAct(UUID id) {
        return inventoryActRepository.findById(id)
                .filter(ia -> !ia.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Инвентаризационная ведомость не найдена: " + id));
    }

    // ============================
    // WriteOffAct (Акт списания)
    // ============================

    @Transactional(readOnly = true)
    public Page<WriteOffAct> listWriteOffActs(UUID projectId, Pageable pageable) {
        return projectId != null
                ? writeOffActRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                : writeOffActRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public WriteOffAct getWriteOffAct(UUID id) {
        return writeOffActRepository.findById(id)
                .filter(w -> !w.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт списания не найден: " + id));
    }
}
