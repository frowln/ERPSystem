package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.specification.domain.ProcurementSchedule;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.repository.ProcurementScheduleRepository;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementScheduleService {

    private final ProcurementScheduleRepository repository;
    private final SpecItemRepository specItemRepository;

    @Transactional(readOnly = true)
    public List<ProcurementSchedule> listByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return repository.findByProjectIdAndOrganizationIdOrderByRequiredByDateAsc(projectId, orgId);
    }

    @Transactional
    public List<ProcurementSchedule> generate(UUID projectId, UUID specificationId, LocalDate projectStartDate) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Get material spec items from this specification
        List<SpecItem> materialItems = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specificationId)
                .stream()
                .filter(si -> si.getItemType() == com.privod.platform.modules.specification.domain.SpecItemType.MATERIAL)
                .toList();

        List<ProcurementSchedule> schedules = new ArrayList<>();
        for (SpecItem item : materialItems) {
            int leadTimeDays = 14; // default lead time
            LocalDate requiredBy = projectStartDate != null ? projectStartDate.plusDays(30) : LocalDate.now().plusDays(30);
            LocalDate orderBy = requiredBy.minusDays(leadTimeDays);

            ProcurementSchedule ps = ProcurementSchedule.builder()
                    .organizationId(orgId)
                    .projectId(projectId)
                    .specItemId(item.getId())
                    .itemName(item.getName())
                    .unit(item.getUnitOfMeasure())
                    .quantity(item.getQuantity())
                    .requiredByDate(requiredBy)
                    .leadTimeDays(leadTimeDays)
                    .orderByDate(orderBy)
                    .status("PENDING")
                    .build();
            schedules.add(ps);
        }

        List<ProcurementSchedule> saved = repository.saveAll(schedules);
        log.info("Generated {} procurement schedule items for project {}", saved.size(), projectId);
        return saved;
    }

    @Transactional
    public ProcurementSchedule updateStatus(UUID id, String status) {
        ProcurementSchedule ps = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Procurement schedule item not found: " + id));
        ps.setStatus(status);
        return repository.save(ps);
    }
}
