package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.StaffingTable;
import com.privod.platform.modules.hrRussian.repository.StaffingTableRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateStaffingTableRequest;
import com.privod.platform.modules.hrRussian.web.dto.StaffingTableResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffingTableService {

    private final StaffingTableRepository staffingTableRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StaffingTableResponse> listActivePositions(Pageable pageable) {
        return staffingTableRepository.findByActiveTrueAndDeletedFalse(pageable)
                .map(StaffingTableResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<StaffingTableResponse> getVacantPositions() {
        return staffingTableRepository.findVacantPositions()
                .stream()
                .map(StaffingTableResponse::fromEntity)
                .toList();
    }

    @Transactional
    public StaffingTableResponse createPosition(CreateStaffingTableRequest request) {
        StaffingTable position = StaffingTable.builder()
                .positionName(request.positionName())
                .departmentId(request.departmentId())
                .grade(request.grade())
                .salaryMin(request.salaryMin() != null ? request.salaryMin() : BigDecimal.ZERO)
                .salaryMax(request.salaryMax() != null ? request.salaryMax() : BigDecimal.ZERO)
                .headcount(request.headcount())
                .filledCount(0)
                .active(true)
                .effectiveDate(request.effectiveDate())
                .build();

        position = staffingTableRepository.save(position);
        auditService.logCreate("StaffingTable", position.getId());

        log.info("Staffing table position created: {} ({})", request.positionName(), position.getId());
        return StaffingTableResponse.fromEntity(position);
    }

    @Transactional
    public void deletePosition(UUID id) {
        StaffingTable position = staffingTableRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция штатного расписания не найдена: " + id));
        position.softDelete();
        staffingTableRepository.save(position);
        auditService.logDelete("StaffingTable", id);
        log.info("Staffing table position soft-deleted: {}", id);
    }
}
