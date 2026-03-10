package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.SickLeave;
import com.privod.platform.modules.hrRussian.domain.SickLeaveStatus;
import com.privod.platform.modules.hrRussian.repository.SickLeaveRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateSickLeaveRequest;
import com.privod.platform.modules.hrRussian.web.dto.SickLeaveResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SickLeaveService {

    private final SickLeaveRepository sickLeaveRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SickLeaveResponse> listSickLeaves(Pageable pageable) {
        return sickLeaveRepository.findByDeletedFalse(pageable)
                .map(SickLeaveResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SickLeaveResponse> getByEmployee(UUID employeeId) {
        return sickLeaveRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId)
                .stream()
                .map(SickLeaveResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SickLeaveResponse getSickLeave(UUID id) {
        SickLeave sickLeave = getSickLeaveOrThrow(id);
        return SickLeaveResponse.fromEntity(sickLeave);
    }

    @Transactional
    public SickLeaveResponse createSickLeave(CreateSickLeaveRequest request) {
        SickLeave sickLeave = SickLeave.builder()
                .employeeId(request.employeeId())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .sickLeaveNumber(request.sickLeaveNumber())
                .diagnosis(request.diagnosis())
                .extension(request.extension())
                .previousSickLeaveId(request.previousSickLeaveId())
                .paymentAmount(request.paymentAmount())
                .status(SickLeaveStatus.OPEN)
                .build();

        sickLeave = sickLeaveRepository.save(sickLeave);
        auditService.logCreate("SickLeave", sickLeave.getId());

        log.info("Sick leave created for employee {}: {} - {} ({})",
                request.employeeId(), request.startDate(), request.endDate(), sickLeave.getId());
        return SickLeaveResponse.fromEntity(sickLeave);
    }

    @Transactional
    public SickLeaveResponse closeSickLeave(UUID id) {
        SickLeave sickLeave = getSickLeaveOrThrow(id);

        if (sickLeave.getStatus() != SickLeaveStatus.OPEN) {
            throw new IllegalStateException("Закрыть можно только открытый больничный лист");
        }

        SickLeaveStatus oldStatus = sickLeave.getStatus();
        sickLeave.setStatus(SickLeaveStatus.CLOSED);
        sickLeave = sickLeaveRepository.save(sickLeave);
        auditService.logStatusChange("SickLeave", sickLeave.getId(),
                oldStatus.name(), SickLeaveStatus.CLOSED.name());

        log.info("Sick leave closed: {}", sickLeave.getId());
        return SickLeaveResponse.fromEntity(sickLeave);
    }

    @Transactional(readOnly = true)
    public List<SickLeaveResponse> getOpenSickLeaves() {
        return sickLeaveRepository.findByStatusAndDeletedFalse(SickLeaveStatus.OPEN)
                .stream()
                .map(SickLeaveResponse::fromEntity)
                .toList();
    }

    private SickLeave getSickLeaveOrThrow(UUID id) {
        return sickLeaveRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Больничный лист не найден: " + id));
    }
}
