package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.BimClash;
import com.privod.platform.modules.bim.domain.ClashStatus;
import com.privod.platform.modules.bim.repository.BimClashRepository;
import com.privod.platform.modules.bim.web.dto.BimClashResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimClashRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BimClashService {

    private final BimClashRepository bimClashRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<BimClashResponse> listClashes(UUID modelId, Pageable pageable) {
        if (modelId != null) {
            return bimClashRepository.findByModelAIdAndDeletedFalse(modelId, pageable)
                    .map(BimClashResponse::fromEntity);
        }
        return bimClashRepository.findByDeletedFalse(pageable)
                .map(BimClashResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BimClashResponse getClash(UUID id) {
        BimClash clash = getClashOrThrow(id);
        return BimClashResponse.fromEntity(clash);
    }

    @Transactional
    public BimClashResponse createClash(CreateBimClashRequest request) {
        BimClash clash = BimClash.builder()
                .modelAId(request.modelAId())
                .modelBId(request.modelBId())
                .elementAId(request.elementAId())
                .elementBId(request.elementBId())
                .clashType(request.clashType())
                .severity(request.severity())
                .status(ClashStatus.NEW)
                .description(request.description())
                .coordinates(request.coordinates())
                .build();

        clash = bimClashRepository.save(clash);
        auditService.logCreate("BimClash", clash.getId());

        log.info("BIM clash created: {} ({})", clash.getClashType(), clash.getId());
        return BimClashResponse.fromEntity(clash);
    }

    @Transactional
    public BimClashResponse resolveClash(UUID id, UUID resolvedById) {
        BimClash clash = getClashOrThrow(id);

        if (clash.getStatus() == ClashStatus.RESOLVED || clash.getStatus() == ClashStatus.APPROVED) {
            throw new IllegalStateException(
                    String.format("Невозможно решить коллизию из статуса '%s'",
                            clash.getStatus().getDisplayName()));
        }

        ClashStatus oldStatus = clash.getStatus();
        clash.setStatus(ClashStatus.RESOLVED);
        clash.setResolvedById(resolvedById);
        clash.setResolvedAt(Instant.now());

        clash = bimClashRepository.save(clash);
        auditService.logStatusChange("BimClash", clash.getId(),
                oldStatus.name(), ClashStatus.RESOLVED.name());

        log.info("BIM clash resolved: {} ({})", clash.getClashType(), clash.getId());
        return BimClashResponse.fromEntity(clash);
    }

    @Transactional
    public BimClashResponse approveClash(UUID id) {
        BimClash clash = getClashOrThrow(id);

        if (clash.getStatus() != ClashStatus.RESOLVED) {
            throw new IllegalStateException(
                    String.format("Утвердить можно только решённую коллизию, текущий статус: '%s'",
                            clash.getStatus().getDisplayName()));
        }

        ClashStatus oldStatus = clash.getStatus();
        clash.setStatus(ClashStatus.APPROVED);

        clash = bimClashRepository.save(clash);
        auditService.logStatusChange("BimClash", clash.getId(),
                oldStatus.name(), ClashStatus.APPROVED.name());

        log.info("BIM clash approved: ({})", clash.getId());
        return BimClashResponse.fromEntity(clash);
    }

    @Transactional
    public void deleteClash(UUID id) {
        BimClash clash = getClashOrThrow(id);
        clash.softDelete();
        bimClashRepository.save(clash);
        auditService.logDelete("BimClash", clash.getId());

        log.info("BIM clash deleted: ({})", clash.getId());
    }

    private BimClash getClashOrThrow(UUID id) {
        return bimClashRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Коллизия не найдена: " + id));
    }
}
