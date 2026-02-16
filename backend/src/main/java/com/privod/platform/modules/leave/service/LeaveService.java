package com.privod.platform.modules.leave.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.leave.domain.LeaveAllocation;
import com.privod.platform.modules.leave.domain.LeaveAllocationStatus;
import com.privod.platform.modules.leave.domain.LeaveRequest;
import com.privod.platform.modules.leave.domain.LeaveRequestStatus;
import com.privod.platform.modules.leave.domain.LeaveType;
import com.privod.platform.modules.leave.repository.LeaveAllocationRepository;
import com.privod.platform.modules.leave.repository.LeaveRequestRepository;
import com.privod.platform.modules.leave.repository.LeaveTypeRepository;
import com.privod.platform.modules.leave.web.dto.CreateLeaveAllocationRequest;
import com.privod.platform.modules.leave.web.dto.CreateLeaveRequestRequest;
import com.privod.platform.modules.leave.web.dto.CreateLeaveTypeRequest;
import com.privod.platform.modules.leave.web.dto.LeaveAllocationResponse;
import com.privod.platform.modules.leave.web.dto.LeaveRequestResponse;
import com.privod.platform.modules.leave.web.dto.LeaveTypeResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveAllocationRepository leaveAllocationRepository;
    private final AuditService auditService;

    // ---- Leave Types ----

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> listLeaveTypes(boolean activeOnly) {
        List<LeaveType> types = activeOnly
                ? leaveTypeRepository.findByIsActiveTrueAndDeletedFalse()
                : leaveTypeRepository.findByDeletedFalse();
        return types.stream().map(LeaveTypeResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public LeaveTypeResponse getLeaveType(UUID id) {
        LeaveType lt = getLeaveTypeOrThrow(id);
        return LeaveTypeResponse.fromEntity(lt);
    }

    @Transactional
    public LeaveTypeResponse createLeaveType(CreateLeaveTypeRequest request) {
        LeaveType lt = LeaveType.builder()
                .name(request.name())
                .code(request.code())
                .color(request.color())
                .maxDays(request.maxDays())
                .requiresApproval(request.requiresApproval() != null ? request.requiresApproval() : true)
                .allowNegative(request.allowNegative() != null ? request.allowNegative() : false)
                .isActive(true)
                .validityStart(request.validityStart())
                .validityEnd(request.validityEnd())
                .build();

        lt = leaveTypeRepository.save(lt);
        auditService.logCreate("LeaveType", lt.getId());

        log.info("Leave type created: {} ({}) ({})", lt.getName(), lt.getCode(), lt.getId());
        return LeaveTypeResponse.fromEntity(lt);
    }

    @Transactional
    public void deleteLeaveType(UUID id) {
        LeaveType lt = getLeaveTypeOrThrow(id);
        lt.softDelete();
        leaveTypeRepository.save(lt);
        auditService.logDelete("LeaveType", id);
        log.info("Leave type soft-deleted: {} ({})", lt.getName(), id);
    }

    // ---- Leave Requests ----

    @Transactional(readOnly = true)
    public Page<LeaveRequestResponse> listLeaveRequests(UUID employeeId, LeaveRequestStatus status,
                                                         UUID approverId, Pageable pageable) {
        if (employeeId != null) {
            return leaveRequestRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(LeaveRequestResponse::fromEntity);
        }
        if (approverId != null && status != null) {
            return leaveRequestRepository.findByApproverIdAndStatusAndDeletedFalse(approverId, status, pageable)
                    .map(LeaveRequestResponse::fromEntity);
        }
        if (status != null) {
            return leaveRequestRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(LeaveRequestResponse::fromEntity);
        }
        return leaveRequestRepository.findAll(pageable).map(LeaveRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LeaveRequestResponse getLeaveRequest(UUID id) {
        LeaveRequest lr = getLeaveRequestOrThrow(id);
        return LeaveRequestResponse.fromEntity(lr);
    }

    @Transactional
    public LeaveRequestResponse createLeaveRequest(CreateLeaveRequestRequest request) {
        getLeaveTypeOrThrow(request.leaveTypeId());

        // Check for overlapping requests
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                request.employeeId(), request.startDate(), request.endDate());
        if (!overlapping.isEmpty()) {
            throw new IllegalStateException("Пересечение с существующим запросом на отпуск");
        }

        LeaveRequest lr = LeaveRequest.builder()
                .employeeId(request.employeeId())
                .leaveTypeId(request.leaveTypeId())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .numberOfDays(request.numberOfDays())
                .reason(request.reason())
                .status(LeaveRequestStatus.DRAFT)
                .build();

        lr = leaveRequestRepository.save(lr);
        auditService.logCreate("LeaveRequest", lr.getId());

        log.info("Leave request created for employee {} ({} days) ({})",
                request.employeeId(), request.numberOfDays(), lr.getId());
        return LeaveRequestResponse.fromEntity(lr);
    }

    @Transactional
    public LeaveRequestResponse submitLeaveRequest(UUID id) {
        LeaveRequest lr = getLeaveRequestOrThrow(id);
        if (lr.getStatus() != LeaveRequestStatus.DRAFT) {
            throw new IllegalStateException("Только черновики могут быть отправлены на рассмотрение");
        }
        lr.setStatus(LeaveRequestStatus.SUBMITTED);
        lr = leaveRequestRepository.save(lr);
        auditService.logUpdate("LeaveRequest", lr.getId(), "status", "DRAFT", "SUBMITTED");

        log.info("Leave request submitted: {}", lr.getId());
        return LeaveRequestResponse.fromEntity(lr);
    }

    @Transactional
    public LeaveRequestResponse approveLeaveRequest(UUID id, UUID approverId) {
        LeaveRequest lr = getLeaveRequestOrThrow(id);
        if (lr.getStatus() != LeaveRequestStatus.SUBMITTED) {
            throw new IllegalStateException("Только поданные запросы могут быть утверждены");
        }

        // Check balance
        checkLeaveBalance(lr.getEmployeeId(), lr.getLeaveTypeId(), lr.getNumberOfDays());

        lr.setStatus(LeaveRequestStatus.APPROVED);
        lr.setApproverId(approverId);
        lr.setApprovedAt(LocalDateTime.now());
        lr = leaveRequestRepository.save(lr);

        // Update allocation used days
        updateAllocationUsedDays(lr.getEmployeeId(), lr.getLeaveTypeId(),
                lr.getStartDate().getYear(), lr.getNumberOfDays());

        auditService.logUpdate("LeaveRequest", lr.getId(), "status", "SUBMITTED", "APPROVED");

        log.info("Leave request approved: {} by {}", lr.getId(), approverId);
        return LeaveRequestResponse.fromEntity(lr);
    }

    @Transactional
    public LeaveRequestResponse refuseLeaveRequest(UUID id, UUID approverId, String refusalReason) {
        LeaveRequest lr = getLeaveRequestOrThrow(id);
        if (lr.getStatus() != LeaveRequestStatus.SUBMITTED) {
            throw new IllegalStateException("Только поданные запросы могут быть отклонены");
        }

        lr.setStatus(LeaveRequestStatus.REFUSED);
        lr.setApproverId(approverId);
        lr.setRefusalReason(refusalReason);
        lr = leaveRequestRepository.save(lr);
        auditService.logUpdate("LeaveRequest", lr.getId(), "status", "SUBMITTED", "REFUSED");

        log.info("Leave request refused: {} by {} reason: {}", lr.getId(), approverId, refusalReason);
        return LeaveRequestResponse.fromEntity(lr);
    }

    @Transactional
    public LeaveRequestResponse cancelLeaveRequest(UUID id) {
        LeaveRequest lr = getLeaveRequestOrThrow(id);
        if (lr.getStatus() == LeaveRequestStatus.CANCELLED) {
            throw new IllegalStateException("Запрос уже отменён");
        }

        String oldStatus = lr.getStatus().name();
        boolean wasApproved = lr.getStatus() == LeaveRequestStatus.APPROVED;

        lr.setStatus(LeaveRequestStatus.CANCELLED);
        lr = leaveRequestRepository.save(lr);

        // Reverse allocation if was approved
        if (wasApproved) {
            updateAllocationUsedDays(lr.getEmployeeId(), lr.getLeaveTypeId(),
                    lr.getStartDate().getYear(), lr.getNumberOfDays().negate());
        }

        auditService.logUpdate("LeaveRequest", lr.getId(), "status", oldStatus, "CANCELLED");

        log.info("Leave request cancelled: {}", lr.getId());
        return LeaveRequestResponse.fromEntity(lr);
    }

    // ---- Leave Allocations ----

    @Transactional(readOnly = true)
    public Page<LeaveAllocationResponse> listAllocations(UUID employeeId, int year, Pageable pageable) {
        if (employeeId != null) {
            return leaveAllocationRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(LeaveAllocationResponse::fromEntity);
        }
        if (year > 0) {
            return leaveAllocationRepository.findByYearAndDeletedFalse(year, pageable)
                    .map(LeaveAllocationResponse::fromEntity);
        }
        return leaveAllocationRepository.findAll(pageable).map(LeaveAllocationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LeaveAllocationResponse getAllocation(UUID id) {
        LeaveAllocation la = getAllocationOrThrow(id);
        return LeaveAllocationResponse.fromEntity(la);
    }

    @Transactional(readOnly = true)
    public List<LeaveAllocationResponse> getEmployeeAllocations(UUID employeeId, int year) {
        return leaveAllocationRepository.findByEmployeeIdAndYearAndDeletedFalse(employeeId, year)
                .stream()
                .map(LeaveAllocationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LeaveAllocationResponse createAllocation(CreateLeaveAllocationRequest request) {
        getLeaveTypeOrThrow(request.leaveTypeId());

        LeaveAllocation la = LeaveAllocation.builder()
                .employeeId(request.employeeId())
                .leaveTypeId(request.leaveTypeId())
                .allocatedDays(request.allocatedDays())
                .usedDays(BigDecimal.ZERO)
                .remainingDays(request.allocatedDays())
                .year(request.year())
                .notes(request.notes())
                .status(LeaveAllocationStatus.DRAFT)
                .build();

        la = leaveAllocationRepository.save(la);
        auditService.logCreate("LeaveAllocation", la.getId());

        log.info("Leave allocation created for employee {} ({} days, year {}) ({})",
                request.employeeId(), request.allocatedDays(), request.year(), la.getId());
        return LeaveAllocationResponse.fromEntity(la);
    }

    @Transactional
    public LeaveAllocationResponse approveAllocation(UUID id) {
        LeaveAllocation la = getAllocationOrThrow(id);
        if (la.getStatus() != LeaveAllocationStatus.DRAFT) {
            throw new IllegalStateException("Только черновики выделений могут быть утверждены");
        }
        la.setStatus(LeaveAllocationStatus.APPROVED);
        la = leaveAllocationRepository.save(la);
        auditService.logUpdate("LeaveAllocation", la.getId(), "status", "DRAFT", "APPROVED");

        log.info("Leave allocation approved: {}", la.getId());
        return LeaveAllocationResponse.fromEntity(la);
    }

    @Transactional
    public LeaveAllocationResponse refuseAllocation(UUID id) {
        LeaveAllocation la = getAllocationOrThrow(id);
        if (la.getStatus() != LeaveAllocationStatus.DRAFT) {
            throw new IllegalStateException("Только черновики выделений могут быть отклонены");
        }
        la.setStatus(LeaveAllocationStatus.REFUSED);
        la = leaveAllocationRepository.save(la);
        auditService.logUpdate("LeaveAllocation", la.getId(), "status", "DRAFT", "REFUSED");

        log.info("Leave allocation refused: {}", la.getId());
        return LeaveAllocationResponse.fromEntity(la);
    }

    // ---- Private helpers ----

    private void checkLeaveBalance(UUID employeeId, UUID leaveTypeId, BigDecimal requestedDays) {
        LeaveType leaveType = getLeaveTypeOrThrow(leaveTypeId);
        if (leaveType.isAllowNegative()) {
            return;
        }

        int year = java.time.LocalDate.now().getYear();
        leaveAllocationRepository.findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
                employeeId, leaveTypeId, year)
                .filter(la -> la.getStatus() == LeaveAllocationStatus.APPROVED)
                .ifPresent(la -> {
                    BigDecimal available = la.getRemainingDays();
                    if (available.compareTo(requestedDays) < 0) {
                        throw new IllegalStateException(
                                String.format("Недостаточно дней отпуска. Доступно: %s, запрошено: %s",
                                        available, requestedDays));
                    }
                });
    }

    private void updateAllocationUsedDays(UUID employeeId, UUID leaveTypeId, int year, BigDecimal days) {
        leaveAllocationRepository.findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
                employeeId, leaveTypeId, year)
                .filter(la -> la.getStatus() == LeaveAllocationStatus.APPROVED)
                .ifPresent(la -> {
                    la.setUsedDays(la.getUsedDays().add(days));
                    la.recalculateRemaining();
                    leaveAllocationRepository.save(la);
                });
    }

    private LeaveType getLeaveTypeOrThrow(UUID id) {
        return leaveTypeRepository.findById(id)
                .filter(lt -> !lt.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Тип отпуска не найден: " + id));
    }

    private LeaveRequest getLeaveRequestOrThrow(UUID id) {
        return leaveRequestRepository.findById(id)
                .filter(lr -> !lr.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запрос на отпуск не найден: " + id));
    }

    private LeaveAllocation getAllocationOrThrow(UUID id) {
        return leaveAllocationRepository.findById(id)
                .filter(la -> !la.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Выделение отпуска не найдено: " + id));
    }
}
