package com.privod.platform.modules.settings.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.NumberSequence;
import com.privod.platform.modules.settings.domain.ResetPeriod;
import com.privod.platform.modules.settings.repository.NumberSequenceRepository;
import com.privod.platform.modules.settings.web.dto.NumberSequenceResponse;
import com.privod.platform.modules.settings.web.dto.UpdateNumberSequenceRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NumberSequenceService {

    private final NumberSequenceRepository numberSequenceRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<NumberSequenceResponse> listAll() {
        return numberSequenceRepository.findByDeletedFalseOrderByCodeAsc()
                .stream()
                .map(NumberSequenceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public NumberSequenceResponse getByCode(String code) {
        NumberSequence seq = numberSequenceRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Нумератор не найден: " + code));
        return NumberSequenceResponse.fromEntity(seq);
    }

    @Transactional(readOnly = true)
    public NumberSequenceResponse getById(UUID id) {
        NumberSequence seq = numberSequenceRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Нумератор не найден: " + id));
        return NumberSequenceResponse.fromEntity(seq);
    }

    /**
     * Thread-safe next number generation using SELECT FOR UPDATE (pessimistic locking).
     * Resets the counter if the reset period has elapsed.
     */
    @Transactional
    public String getNextNumber(String code) {
        NumberSequence seq = numberSequenceRepository.findByCodeForUpdate(code)
                .orElseThrow(() -> new EntityNotFoundException("Нумератор не найден: " + code));

        resetIfNeeded(seq);

        String formatted = seq.formatCurrentNumber();
        seq.increment();
        numberSequenceRepository.save(seq);

        log.debug("Generated next number for {}: {}", code, formatted);
        return formatted;
    }

    @Transactional
    public NumberSequenceResponse updateSequence(UUID id, UpdateNumberSequenceRequest request) {
        NumberSequence seq = numberSequenceRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Нумератор не найден: " + id));

        if (request.name() != null) {
            seq.setName(request.name());
        }
        if (request.prefix() != null) {
            seq.setPrefix(request.prefix());
        }
        if (request.suffix() != null) {
            seq.setSuffix(request.suffix());
        }
        if (request.step() != null) {
            seq.setStep(request.step());
        }
        if (request.padding() != null) {
            seq.setPadding(request.padding());
        }
        if (request.resetPeriod() != null) {
            seq.setResetPeriod(request.resetPeriod());
        }

        seq = numberSequenceRepository.save(seq);
        auditService.logUpdate("NumberSequence", seq.getId(), "multiple", null, null);

        log.info("Number sequence updated: {} ({})", seq.getCode(), seq.getId());
        return NumberSequenceResponse.fromEntity(seq);
    }

    /**
     * Resets the sequence counter if the reset period has elapsed.
     */
    private void resetIfNeeded(NumberSequence seq) {
        if (seq.getResetPeriod() == ResetPeriod.NEVER) {
            return;
        }

        LocalDate now = LocalDate.now();
        LocalDate lastReset = seq.getLastResetDate();

        boolean shouldReset = false;
        if (lastReset == null) {
            shouldReset = true;
        } else if (seq.getResetPeriod() == ResetPeriod.YEARLY) {
            shouldReset = now.getYear() != lastReset.getYear();
        } else if (seq.getResetPeriod() == ResetPeriod.MONTHLY) {
            shouldReset = now.getYear() != lastReset.getYear()
                    || now.getMonthValue() != lastReset.getMonthValue();
        }

        if (shouldReset) {
            seq.setNextNumber(1L);
            seq.setLastResetDate(now);
            log.info("Number sequence {} reset. Period: {}", seq.getCode(), seq.getResetPeriod());
        }
    }
}
