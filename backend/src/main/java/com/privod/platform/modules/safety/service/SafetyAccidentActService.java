package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.AccidentAct;
import com.privod.platform.modules.safety.domain.AccidentActStatus;
import com.privod.platform.modules.safety.repository.AccidentActRepository;
import com.privod.platform.modules.safety.web.dto.AccidentActResponse;
import com.privod.platform.modules.safety.web.dto.CreateAccidentActRequest;
import com.privod.platform.modules.safety.web.dto.UpdateAccidentActStatusRequest;
import jakarta.persistence.EntityNotFoundException;
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
public class SafetyAccidentActService {

    private final AccidentActRepository accidentActRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AccidentActResponse> listActs(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return accidentActRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(
                    organizationId, projectId, pageable)
                    .map(AccidentActResponse::fromEntity);
        }
        return accidentActRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(AccidentActResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AccidentActResponse getAct(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccidentAct act = getActOrThrow(id, organizationId);
        return AccidentActResponse.fromEntity(act);
    }

    @Transactional
    public AccidentActResponse createAct(CreateAccidentActRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        String actNumber = generateActNumber();

        AccidentAct act = AccidentAct.builder()
                .organizationId(organizationId)
                .actNumber(actNumber)
                .projectId(request.projectId())
                .incidentId(request.incidentId())
                .accidentDate(request.accidentDate())
                .accidentLocation(request.accidentLocation())
                .victimFullName(request.victimFullName())
                .victimPosition(request.victimPosition())
                .victimBirthDate(request.victimBirthDate())
                .victimGender(request.victimGender())
                .victimWorkExperience(request.victimWorkExperience())
                .victimBriefingDate(request.victimBriefingDate())
                .victimBriefingType(request.victimBriefingType())
                .commissionChairman(request.commissionChairman())
                .commissionMembers(request.commissionMembers())
                .circumstances(request.circumstances())
                .rootCauses(request.rootCauses())
                .correctiveMeasures(request.correctiveMeasures())
                .responsiblePersons(request.responsiblePersons())
                .injuryDescription(request.injuryDescription())
                .injurySeverity(request.injurySeverity())
                .workDaysLost(request.workDaysLost() != null ? request.workDaysLost() : 0)
                .hospitalization(request.hospitalization())
                .fatal(request.fatal())
                .status(AccidentActStatus.DRAFT)
                .notes(request.notes())
                .build();

        act = accidentActRepository.save(act);
        auditService.logCreate("AccidentAct", act.getId());

        log.info("Accident act created: {} for victim {} ({})",
                act.getActNumber(), act.getVictimFullName(), act.getId());
        return AccidentActResponse.fromEntity(act);
    }

    @Transactional
    public AccidentActResponse updateStatus(UUID id, UpdateAccidentActStatusRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccidentAct act = getActOrThrow(id, organizationId);

        AccidentActStatus newStatus = request.status();
        if (!act.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести акт из статуса '%s' в '%s'",
                            act.getStatus().getDisplayName(), newStatus.getDisplayName()));
        }

        AccidentActStatus oldStatus = act.getStatus();
        act.setStatus(newStatus);

        if (newStatus == AccidentActStatus.APPROVED) {
            act.setApprovedByName(request.approvedByName());
            act.setApprovedDate(LocalDate.now());
        }
        if (newStatus == AccidentActStatus.SENT_TO_AUTHORITIES) {
            act.setSentToAuthoritiesDate(LocalDate.now());
        }
        if (request.notes() != null) {
            act.setNotes(request.notes());
        }

        act = accidentActRepository.save(act);
        auditService.logStatusChange("AccidentAct", act.getId(),
                oldStatus.name(), newStatus.name());

        log.info("Accident act status updated: {} {} -> {} ({})",
                act.getActNumber(), oldStatus.name(), newStatus.name(), act.getId());
        return AccidentActResponse.fromEntity(act);
    }

    private AccidentAct getActOrThrow(UUID id, UUID organizationId) {
        return accidentActRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Акт о несчастном случае не найден: " + id));
    }

    private String generateActNumber() {
        long seq = accidentActRepository.getNextNumberSequence();
        int year = java.time.Year.now().getValue();
        return String.format("Н1-%d-%05d", year, seq);
    }
}
