package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.BusinessTrip;
import com.privod.platform.modules.hrRussian.domain.BusinessTripStatus;
import com.privod.platform.modules.hrRussian.repository.BusinessTripRepository;
import com.privod.platform.modules.hrRussian.web.dto.BusinessTripResponse;
import com.privod.platform.modules.hrRussian.web.dto.CreateBusinessTripRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessTripService {

    private final BusinessTripRepository businessTripRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<BusinessTripResponse> getByEmployee(UUID employeeId) {
        return businessTripRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId)
                .stream()
                .map(BusinessTripResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BusinessTripResponse getBusinessTrip(UUID id) {
        BusinessTrip trip = getTripOrThrow(id);
        return BusinessTripResponse.fromEntity(trip);
    }

    @Transactional
    public BusinessTripResponse createBusinessTrip(CreateBusinessTripRequest request) {
        BusinessTrip trip = BusinessTrip.builder()
                .employeeId(request.employeeId())
                .destination(request.destination())
                .purpose(request.purpose())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .dailyAllowance(request.dailyAllowance() != null ? request.dailyAllowance() : BigDecimal.ZERO)
                .totalBudget(request.totalBudget() != null ? request.totalBudget() : BigDecimal.ZERO)
                .orderId(request.orderId())
                .status(BusinessTripStatus.PLANNED)
                .build();

        trip = businessTripRepository.save(trip);
        auditService.logCreate("BusinessTrip", trip.getId());

        log.info("Business trip created for employee {} to {} ({})",
                request.employeeId(), request.destination(), trip.getId());
        return BusinessTripResponse.fromEntity(trip);
    }

    @Transactional
    public BusinessTripResponse approveTrip(UUID id) {
        BusinessTrip trip = getTripOrThrow(id);

        if (trip.getStatus() != BusinessTripStatus.PLANNED) {
            throw new IllegalStateException("Утвердить можно только запланированную командировку");
        }

        BusinessTripStatus oldStatus = trip.getStatus();
        trip.setStatus(BusinessTripStatus.APPROVED);
        trip = businessTripRepository.save(trip);
        auditService.logStatusChange("BusinessTrip", trip.getId(),
                oldStatus.name(), BusinessTripStatus.APPROVED.name());

        log.info("Business trip approved: {}", trip.getId());
        return BusinessTripResponse.fromEntity(trip);
    }

    @Transactional
    public BusinessTripResponse completeTrip(UUID id) {
        BusinessTrip trip = getTripOrThrow(id);

        if (trip.getStatus() != BusinessTripStatus.ACTIVE && trip.getStatus() != BusinessTripStatus.APPROVED) {
            throw new IllegalStateException("Завершить можно только активную или утверждённую командировку");
        }

        BusinessTripStatus oldStatus = trip.getStatus();
        trip.setStatus(BusinessTripStatus.COMPLETED);
        trip = businessTripRepository.save(trip);
        auditService.logStatusChange("BusinessTrip", trip.getId(),
                oldStatus.name(), BusinessTripStatus.COMPLETED.name());

        log.info("Business trip completed: {}", trip.getId());
        return BusinessTripResponse.fromEntity(trip);
    }

    @Transactional(readOnly = true)
    public List<BusinessTripResponse> getActiveTrips() {
        return businessTripRepository.findByStatusAndDeletedFalse(BusinessTripStatus.ACTIVE)
                .stream()
                .map(BusinessTripResponse::fromEntity)
                .toList();
    }

    private BusinessTrip getTripOrThrow(UUID id) {
        return businessTripRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Командировка не найдена: " + id));
    }
}
