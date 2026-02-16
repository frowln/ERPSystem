package com.privod.platform.modules.immutableAudit.service;

import com.privod.platform.modules.immutableAudit.domain.ImmutableRecord;
import com.privod.platform.modules.immutableAudit.domain.RecordSupersession;
import com.privod.platform.modules.immutableAudit.repository.ImmutableRecordRepository;
import com.privod.platform.modules.immutableAudit.repository.RecordSupersessionRepository;
import com.privod.platform.modules.immutableAudit.web.dto.ChainVerificationResponse;
import com.privod.platform.modules.immutableAudit.web.dto.CreateImmutableRecordRequest;
import com.privod.platform.modules.immutableAudit.web.dto.ImmutableRecordResponse;
import com.privod.platform.modules.immutableAudit.web.dto.RecordSupersessionResponse;
import com.privod.platform.modules.immutableAudit.web.dto.SupersedeRecordRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImmutableRecordService {

    private final ImmutableRecordRepository recordRepository;
    private final RecordSupersessionRepository supersessionRepository;

    @Transactional(readOnly = true)
    public Page<ImmutableRecordResponse> findAll(String entityType, UUID entityId, Pageable pageable) {
        Specification<ImmutableRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return recordRepository.findAll(spec, pageable).map(ImmutableRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ImmutableRecordResponse findById(UUID id) {
        ImmutableRecord record = getOrThrow(id);
        return ImmutableRecordResponse.fromEntity(record);
    }

    @Transactional
    public ImmutableRecordResponse create(CreateImmutableRecordRequest request) {
        Optional<ImmutableRecord> previousRecord = recordRepository
                .findFirstByEntityTypeAndEntityIdAndDeletedFalseOrderByRecordedAtDesc(
                        request.entityType(), request.entityId());

        UUID previousRecordId = previousRecord.map(ImmutableRecord::getId).orElse(null);
        String previousHash = previousRecord.map(ImmutableRecord::getRecordHash).orElse("");

        int version = previousRecord.map(r -> r.getRecordVersion() + 1).orElse(1);
        String action = request.action() != null ? request.action() :
                (previousRecord.isEmpty() ? "CREATE" : "UPDATE");

        String hash = computeHash(request.contentSnapshot(), previousHash);

        ImmutableRecord record = ImmutableRecord.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .recordHash(hash)
                .contentSnapshot(request.contentSnapshot())
                .previousRecordId(previousRecordId)
                .recordedAt(Instant.now())
                .recordedById(request.recordedById())
                .action(action)
                .recordVersion(version)
                .isSuperseded(false)
                .chainValid(true)
                .build();

        record = recordRepository.save(record);

        log.info("Неизменяемая запись создана: {} {} v{} ({})",
                record.getEntityType(), record.getEntityId(), record.getRecordVersion(), record.getId());
        return ImmutableRecordResponse.fromEntity(record);
    }

    @Transactional
    public ImmutableRecordResponse recordEntity(String entityType, UUID entityId,
                                                 String contentSnapshot, UUID recordedById) {
        CreateImmutableRecordRequest request = new CreateImmutableRecordRequest(
                entityType, entityId, contentSnapshot, recordedById, null);
        return create(request);
    }

    @Transactional
    public ImmutableRecordResponse supersede(SupersedeRecordRequest request) {
        ImmutableRecord original = getOrThrow(request.originalRecordId());

        if (original.getIsSuperseded()) {
            throw new IllegalStateException("Запись уже была замещена: " + request.originalRecordId());
        }

        ImmutableRecordResponse newRecord = recordEntity(
                original.getEntityType(), original.getEntityId(),
                request.newContentSnapshot(), request.supersededById());

        ImmutableRecord newImmutableRecord = recordRepository.findById(newRecord.id())
                .orElseThrow();
        newImmutableRecord.setAction("SUPERSEDE");
        recordRepository.save(newImmutableRecord);

        original.setIsSuperseded(true);
        original.setSupersededById(newRecord.id());
        original.setSupersededAt(Instant.now());
        recordRepository.save(original);

        RecordSupersession supersession = RecordSupersession.builder()
                .originalRecordId(request.originalRecordId())
                .supersedingRecordId(newRecord.id())
                .reason(request.reason())
                .supersededAt(Instant.now())
                .supersededById(request.supersededById())
                .build();

        supersessionRepository.save(supersession);

        log.info("Запись замещена: {} -> {} (причина: {})",
                request.originalRecordId(), newRecord.id(), request.reason());
        return ImmutableRecordResponse.fromEntity(newImmutableRecord);
    }

    @Transactional(readOnly = true)
    public ChainVerificationResponse verifyChain(String entityType, UUID entityId) {
        List<ImmutableRecord> chain = recordRepository.findChain(entityType, entityId);

        if (chain.isEmpty()) {
            return new ChainVerificationResponse(entityType, entityId, 0, true,
                    "Цепочка записей пуста");
        }

        String previousHash = "";
        for (ImmutableRecord record : chain) {
            String expectedHash = computeHash(record.getContentSnapshot(), previousHash);
            if (!expectedHash.equals(record.getRecordHash())) {
                log.warn("Нарушение целостности цепочки для {} {}: запись {}",
                        entityType, entityId, record.getId());
                return new ChainVerificationResponse(entityType, entityId, chain.size(), false,
                        "Нарушение целостности цепочки на записи: " + record.getId());
            }
            previousHash = record.getRecordHash();
        }

        return new ChainVerificationResponse(entityType, entityId, chain.size(), true,
                "Целостность цепочки подтверждена");
    }

    @Transactional(readOnly = true)
    public List<RecordSupersessionResponse> getSupersessions(UUID recordId) {
        return supersessionRepository.findByOriginalRecordIdAndDeletedFalse(recordId)
                .stream()
                .map(RecordSupersessionResponse::fromEntity)
                .toList();
    }

    String computeHash(String content, String previousHash) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = (previousHash != null ? previousHash : "") + (content != null ? content : "");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 алгоритм не найден", e);
        }
    }

    private ImmutableRecord getOrThrow(UUID id) {
        return recordRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Неизменяемая запись не найдена: " + id));
    }
}
