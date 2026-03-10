package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.TrainingRecord;
import com.privod.platform.modules.safety.repository.TrainingRecordRepository;
import com.privod.platform.modules.safety.web.dto.CreateTrainingRecordRequest;
import com.privod.platform.modules.safety.web.dto.TrainingRecordResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyTrainingRecordService {

    private final TrainingRecordRepository trainingRecordRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TrainingRecordResponse> listRecords(UUID employeeId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Page<TrainingRecord> page;
        if (employeeId != null) {
            page = trainingRecordRepository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(
                    organizationId, employeeId, pageable);
        } else {
            page = trainingRecordRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional
    public TrainingRecordResponse createRecord(CreateTrainingRecordRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        TrainingRecord record = TrainingRecord.builder()
                .organizationId(organizationId)
                .employeeId(request.employeeId())
                .employeeName(request.employeeName())
                .trainingType(request.trainingType())
                .completedDate(request.completedDate())
                .expiryDate(request.expiryDate())
                .certificateNumber(request.certificateNumber())
                .notes(request.notes())
                .build();

        record = trainingRecordRepository.save(record);
        auditService.logCreate("TrainingRecord", record.getId());

        log.info("Training record created for employee {} type {} ({})",
                request.employeeId(), request.trainingType(), record.getId());
        return toResponse(record);
    }

    private TrainingRecordResponse toResponse(TrainingRecord entity) {
        boolean expired = entity.getExpiryDate() != null
                && entity.getExpiryDate().isBefore(LocalDate.now());
        return new TrainingRecordResponse(
                entity.getId(),
                entity.getEmployeeId(),
                entity.getEmployeeName(),
                entity.getTrainingType(),
                entity.getCompletedDate(),
                entity.getExpiryDate(),
                entity.getCertificateNumber(),
                expired,
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
