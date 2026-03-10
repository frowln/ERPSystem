package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.domain.VacationStatus;
import com.privod.platform.modules.hrRussian.repository.VacationRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateVacationRequest;
import com.privod.platform.modules.hrRussian.web.dto.VacationResponse;
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
public class VacationService {

    private final VacationRepository vacationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<VacationResponse> listVacations(Pageable pageable) {
        return vacationRepository.findByDeletedFalse(pageable)
                .map(VacationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<VacationResponse> getByEmployee(UUID employeeId) {
        return vacationRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId)
                .stream()
                .map(VacationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public VacationResponse getVacation(UUID id) {
        Vacation vacation = getVacationOrThrow(id);
        return VacationResponse.fromEntity(vacation);
    }

    @Transactional
    public VacationResponse createVacation(CreateVacationRequest request) {
        // Check for overlapping vacations
        List<Vacation> overlapping = vacationRepository.findByEmployeeAndDateRange(
                request.employeeId(), request.startDate(), request.endDate());
        if (!overlapping.isEmpty()) {
            throw new IllegalStateException("У сотрудника уже есть отпуск на указанные даты");
        }

        Vacation vacation = Vacation.builder()
                .employeeId(request.employeeId())
                .vacationType(request.vacationType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .daysCount(request.daysCount())
                .status(VacationStatus.PLANNED)
                .orderId(request.orderId())
                .substitutingEmployeeId(request.substitutingEmployeeId())
                .build();

        vacation = vacationRepository.save(vacation);
        auditService.logCreate("Vacation", vacation.getId());

        log.info("Vacation created for employee {}: {} - {} ({})",
                request.employeeId(), request.startDate(), request.endDate(), vacation.getId());
        return VacationResponse.fromEntity(vacation);
    }

    @Transactional
    public VacationResponse approveVacation(UUID id) {
        Vacation vacation = getVacationOrThrow(id);

        if (vacation.getStatus() != VacationStatus.PLANNED) {
            throw new IllegalStateException("Утвердить можно только запланированный отпуск");
        }

        VacationStatus oldStatus = vacation.getStatus();
        vacation.setStatus(VacationStatus.APPROVED);
        vacation = vacationRepository.save(vacation);
        auditService.logStatusChange("Vacation", vacation.getId(),
                oldStatus.name(), VacationStatus.APPROVED.name());

        log.info("Vacation approved: {}", vacation.getId());
        return VacationResponse.fromEntity(vacation);
    }

    @Transactional
    public VacationResponse cancelVacation(UUID id) {
        Vacation vacation = getVacationOrThrow(id);

        if (vacation.getStatus() == VacationStatus.COMPLETED) {
            throw new IllegalStateException("Нельзя отменить завершённый отпуск");
        }

        VacationStatus oldStatus = vacation.getStatus();
        vacation.setStatus(VacationStatus.CANCELLED);
        vacation = vacationRepository.save(vacation);
        auditService.logStatusChange("Vacation", vacation.getId(),
                oldStatus.name(), VacationStatus.CANCELLED.name());

        log.info("Vacation cancelled: {}", vacation.getId());
        return VacationResponse.fromEntity(vacation);
    }

    @Transactional
    public void deleteVacation(UUID id) {
        Vacation vacation = getVacationOrThrow(id);
        vacation.softDelete();
        vacationRepository.save(vacation);
        auditService.logDelete("Vacation", id);
        log.info("Vacation soft-deleted: {}", id);
    }

    private Vacation getVacationOrThrow(UUID id) {
        return vacationRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Отпуск не найден: " + id));
    }
}
