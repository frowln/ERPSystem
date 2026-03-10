package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.BriefingAttendee;
import com.privod.platform.modules.safety.domain.BriefingStatus;
import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyBriefing;
import com.privod.platform.modules.safety.repository.SafetyBriefingRepository;
import com.privod.platform.modules.safety.web.dto.CreateSafetyBriefingRequest;
import com.privod.platform.modules.safety.web.dto.SafetyBriefingResponse;
import com.privod.platform.modules.safety.web.dto.UpdateSafetyBriefingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyBriefingService {

    private static final int REPEAT_INTERVAL_MONTHS = 6;

    private final SafetyBriefingRepository briefingRepository;

    @Transactional(readOnly = true)
    public Page<SafetyBriefingResponse> listBriefings(UUID projectId, String briefingType,
                                                       String status, String search,
                                                       Pageable pageable) {
        Specification<SafetyBriefing> spec = (root, query, cb) -> cb.isFalse(root.get("deleted"));

        if (projectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("projectId"), projectId));
        }
        if (briefingType != null && !briefingType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("briefingType").as(String.class), briefingType));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status").as(String.class), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("instructorName")), pattern),
                    cb.like(cb.lower(root.get("topic")), pattern)
            ));
        }

        return briefingRepository.findAll(spec, pageable).map(SafetyBriefingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SafetyBriefingResponse getBriefing(UUID id) {
        SafetyBriefing briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Инструктаж не найден: " + id));
        return SafetyBriefingResponse.fromEntity(briefing);
    }

    @Transactional
    public SafetyBriefingResponse createBriefing(CreateSafetyBriefingRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        SafetyBriefing briefing = SafetyBriefing.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .briefingType(request.briefingType())
                .briefingDate(request.briefingDate())
                .instructorId(request.instructorId())
                .instructorName(request.instructorName())
                .topic(request.topic())
                .notes(request.notes())
                .build();

        // Auto-calculate next briefing date for REPEAT type
        if (request.briefingType() == BriefingType.REPEAT) {
            briefing.setNextBriefingDate(request.briefingDate().plusMonths(REPEAT_INTERVAL_MONTHS));
        }

        if (request.attendees() != null) {
            for (CreateSafetyBriefingRequest.AttendeeRequest ar : request.attendees()) {
                BriefingAttendee attendee = BriefingAttendee.builder()
                        .employeeId(ar.employeeId())
                        .employeeName(ar.employeeName())
                        .build();
                briefing.addAttendee(attendee);
            }
        }

        briefing = briefingRepository.save(briefing);
        return SafetyBriefingResponse.fromEntity(briefing);
    }

    @Transactional
    public SafetyBriefingResponse updateBriefing(UUID id, UpdateSafetyBriefingRequest request) {
        SafetyBriefing briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Инструктаж не найден: " + id));

        if (request.projectId() != null) briefing.setProjectId(request.projectId());
        if (request.briefingType() != null) briefing.setBriefingType(request.briefingType());
        if (request.briefingDate() != null) briefing.setBriefingDate(request.briefingDate());
        if (request.instructorId() != null) briefing.setInstructorId(request.instructorId());
        if (request.instructorName() != null) briefing.setInstructorName(request.instructorName());
        if (request.topic() != null) briefing.setTopic(request.topic());
        if (request.notes() != null) briefing.setNotes(request.notes());

        if (request.attendees() != null) {
            briefing.getAttendees().clear();
            for (CreateSafetyBriefingRequest.AttendeeRequest ar : request.attendees()) {
                BriefingAttendee attendee = BriefingAttendee.builder()
                        .employeeId(ar.employeeId())
                        .employeeName(ar.employeeName())
                        .build();
                briefing.addAttendee(attendee);
            }
        }

        briefing = briefingRepository.save(briefing);
        return SafetyBriefingResponse.fromEntity(briefing);
    }

    @Transactional
    public SafetyBriefingResponse signBriefing(UUID id, UUID employeeId) {
        SafetyBriefing briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Инструктаж не найден: " + id));

        briefing.getAttendees().stream()
                .filter(a -> a.getEmployeeId().equals(employeeId) && !a.isSigned())
                .findFirst()
                .ifPresent(a -> {
                    a.setSigned(true);
                    a.setSignedAt(Instant.now());
                });

        // If all attendees signed, auto-complete
        boolean allSigned = briefing.getAttendees().stream()
                .filter(a -> !a.isDeleted())
                .allMatch(BriefingAttendee::isSigned);
        if (allSigned && !briefing.getAttendees().isEmpty()) {
            briefing.setStatus(BriefingStatus.COMPLETED);
        }

        briefing = briefingRepository.save(briefing);
        return SafetyBriefingResponse.fromEntity(briefing);
    }

    @Transactional
    public SafetyBriefingResponse completeBriefing(UUID id) {
        SafetyBriefing briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Инструктаж не найден: " + id));

        briefing.setStatus(BriefingStatus.COMPLETED);

        // Auto-schedule next repeat briefing
        if (briefing.getBriefingType() == BriefingType.REPEAT) {
            LocalDate nextDate = briefing.getBriefingDate().plusMonths(REPEAT_INTERVAL_MONTHS);
            briefing.setNextBriefingDate(nextDate);
            log.info("Next repeat briefing scheduled for {}", nextDate);
        }

        briefing = briefingRepository.save(briefing);
        return SafetyBriefingResponse.fromEntity(briefing);
    }

    @Transactional
    public void deleteBriefing(UUID id) {
        SafetyBriefing briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Инструктаж не найден: " + id));
        briefing.softDelete();
        briefingRepository.save(briefing);
    }
}
