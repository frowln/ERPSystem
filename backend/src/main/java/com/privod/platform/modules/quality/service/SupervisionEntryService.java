package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.quality.domain.ComplianceStatus;
import com.privod.platform.modules.quality.domain.SupervisionEntry;
import com.privod.platform.modules.quality.repository.SupervisionEntryRepository;
import com.privod.platform.modules.quality.web.dto.CreateSupervisionEntryRequest;
import com.privod.platform.modules.quality.web.dto.SupervisionEntryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisionEntryService {

    private final SupervisionEntryRepository supervisionEntryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SupervisionEntryResponse> list(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return supervisionEntryRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(SupervisionEntryResponse::fromEntity);
        }
        return supervisionEntryRepository.findByDeletedFalse(pageable)
                .map(SupervisionEntryResponse::fromEntity);
    }

    @Transactional
    public SupervisionEntryResponse create(CreateSupervisionEntryRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateNumber();

        SupervisionEntry entry = SupervisionEntry.builder()
                .organizationId(organizationId)
                .number(number)
                .entryDate(request.date())
                .inspectorName(request.inspectorName())
                .workType(request.workType())
                .remarks(request.remarks())
                .directives(request.directives())
                .complianceStatus(ComplianceStatus.compliant)
                .projectId(request.projectId())
                .build();

        entry = supervisionEntryRepository.save(entry);
        auditService.logCreate("SupervisionEntry", entry.getId());

        log.info("Supervision entry created: {} ({})", entry.getNumber(), entry.getId());
        return SupervisionEntryResponse.fromEntity(entry);
    }

    private String generateNumber() {
        long seq = supervisionEntryRepository.getNextNumberSequence();
        return String.format("SE-%05d", seq);
    }
}
