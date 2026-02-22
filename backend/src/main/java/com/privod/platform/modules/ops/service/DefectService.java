package com.privod.platform.modules.ops.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.domain.DefectSeverity;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.DefectDashboardResponse;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
import com.privod.platform.modules.ops.web.dto.UpdateDefectRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DefectService {

    private final DefectRepository defectRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public Page<DefectResponse> listDefects(UUID projectId, UUID contractorId, String severity,
                                            String status, String search, Pageable pageable) {
        Specification<Defect> spec = (root, query, cb) -> cb.isFalse(root.get("deleted"));

        if (projectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("projectId"), projectId));
        }
        if (contractorId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("contractorId"), contractorId));
        }
        if (severity != null && !severity.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("severity").as(String.class), severity));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status").as(String.class), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("location")), pattern)
            ));
        }

        return defectRepository.findAll(spec, pageable).map(DefectResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DefectResponse getDefect(UUID id) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Дефект не найден: " + id));
        return DefectResponse.fromEntity(defect);
    }

    @Transactional
    public DefectResponse createDefect(CreateDefectRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Defect defect = Defect.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .qualityCheckId(request.qualityCheckId())
                .code("DEF-" + defectRepository.getNextCodeSequence())
                .title(request.title())
                .description(request.description())
                .location(request.location())
                .severity(request.severity() != null ? request.severity() : DefectSeverity.MEDIUM)
                .photoUrls(request.photoUrls())
                .detectedById(request.detectedById())
                .assignedToId(request.assignedToId())
                .contractorId(request.contractorId())
                .fixDeadline(request.fixDeadline())
                .slaDeadlineHours(request.slaDeadlineHours())
                .drawingId(request.drawingId())
                .pinX(request.pinX())
                .pinY(request.pinY())
                .build();

        defect = defectRepository.save(defect);
        return DefectResponse.fromEntity(defect);
    }

    @Transactional
    public DefectResponse updateDefect(UUID id, UpdateDefectRequest request) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Дефект не найден: " + id));

        if (request.title() != null) defect.setTitle(request.title());
        if (request.description() != null) defect.setDescription(request.description());
        if (request.location() != null) defect.setLocation(request.location());
        if (request.severity() != null) defect.setSeverity(request.severity());
        if (request.photoUrls() != null) defect.setPhotoUrls(request.photoUrls());
        if (request.assignedToId() != null) defect.setAssignedToId(request.assignedToId());
        if (request.contractorId() != null) defect.setContractorId(request.contractorId());
        if (request.fixDeadline() != null) defect.setFixDeadline(request.fixDeadline());
        if (request.slaDeadlineHours() != null) defect.setSlaDeadlineHours(request.slaDeadlineHours());
        if (request.fixDescription() != null) defect.setFixDescription(request.fixDescription());
        if (request.drawingId() != null) defect.setDrawingId(request.drawingId());
        if (request.pinX() != null) defect.setPinX(request.pinX());
        if (request.pinY() != null) defect.setPinY(request.pinY());

        defect = defectRepository.save(defect);
        return DefectResponse.fromEntity(defect);
    }

    @Transactional
    public DefectResponse transitionStatus(UUID id, DefectStatus newStatus, String fixDescription) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Дефект не найден: " + id));

        if (!defect.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    "Невозможен переход из " + defect.getStatus() + " в " + newStatus);
        }

        DefectStatus oldStatus = defect.getStatus();
        defect.setStatus(newStatus);

        if (newStatus == DefectStatus.IN_PROGRESS && defect.getAssignedAt() == null) {
            defect.setAssignedAt(Instant.now());
        }

        if (newStatus == DefectStatus.FIXED) {
            defect.setFixedAt(Instant.now());
            defect.setVerificationRequestedAt(Instant.now());
            if (fixDescription != null) {
                defect.setFixDescription(fixDescription);
            }
        }

        // Re-inspection loop: FIXED → IN_PROGRESS increments reinspection counter
        if (oldStatus == DefectStatus.FIXED && newStatus == DefectStatus.IN_PROGRESS) {
            defect.setReinspectionCount(defect.getReinspectionCount() + 1);
            defect.setVerificationRequestedAt(null);
        }

        defect = defectRepository.save(defect);
        return DefectResponse.fromEntity(defect);
    }

    @Transactional
    public void deleteDefect(UUID id) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Дефект не найден: " + id));
        defect.softDelete();
        defectRepository.save(defect);
    }

    @Transactional(readOnly = true)
    public DefectDashboardResponse getDashboard() {
        long totalOpen = defectRepository.countOpen();
        long totalOverdue = defectRepository.countOverdue();
        Double avgHours = defectRepository.avgResolutionHours();

        // Severity breakdown
        Map<String, Long> bySeverity = new HashMap<>();
        for (Object[] row : defectRepository.countOpenBySeverity()) {
            bySeverity.put(row[0].toString(), (Long) row[1]);
        }

        // By contractor — batch name resolution instead of N+1
        List<Object[]> contractorRows = defectRepository.countByContractorAndStatus();
        List<UUID> contractorIds = contractorRows.stream()
                .map(r -> (UUID) r[0]).distinct().toList();
        Map<UUID, String> contractorNames = new HashMap<>();
        if (!contractorIds.isEmpty()) {
            counterpartyRepository.findAllById(contractorIds)
                    .forEach(c -> contractorNames.put(c.getId(), c.getName()));
        }
        List<DefectDashboardResponse.GroupStats> byContractor = buildGroupStats(
                contractorRows, id -> contractorNames.getOrDefault(id, "—"));

        // By project — batch name resolution instead of N+1
        List<Object[]> projectRows = defectRepository.countByProjectAndStatus();
        List<UUID> projectIds = projectRows.stream()
                .map(r -> (UUID) r[0]).distinct().toList();
        Map<UUID, String> projectNames = new HashMap<>();
        if (!projectIds.isEmpty()) {
            projectRepository.findAllById(projectIds)
                    .forEach(p -> projectNames.put(p.getId(), p.getName()));
        }
        List<DefectDashboardResponse.GroupStats> byProject = buildGroupStats(
                projectRows, id -> projectNames.getOrDefault(id, "—"));

        return new DefectDashboardResponse(totalOpen, totalOverdue, avgHours, bySeverity, byContractor, byProject);
    }

    private List<DefectDashboardResponse.GroupStats> buildGroupStats(
            List<Object[]> rows, Function<UUID, String> nameLookup) {
        // rows: [groupId, status, count]
        Map<UUID, Map<String, Long>> grouped = new HashMap<>();
        for (Object[] row : rows) {
            UUID groupId = (UUID) row[0];
            String status = row[1].toString();
            Long count = (Long) row[2];
            grouped.computeIfAbsent(groupId, k -> new HashMap<>()).put(status, count);
        }

        // Resolve names in batch
        Map<UUID, String> names = new HashMap<>();
        for (UUID id : grouped.keySet()) {
            names.put(id, nameLookup.apply(id));
        }

        List<DefectDashboardResponse.GroupStats> result = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            UUID id = entry.getKey();
            Map<String, Long> counts = entry.getValue();
            long open = counts.getOrDefault("OPEN", 0L);
            long inProgress = counts.getOrDefault("IN_PROGRESS", 0L);
            long fixed = counts.getOrDefault("FIXED", 0L);
            long verified = counts.getOrDefault("VERIFIED", 0L);
            long total = counts.values().stream().mapToLong(Long::longValue).sum();
            result.add(new DefectDashboardResponse.GroupStats(id, names.get(id), open, inProgress, fixed, verified, total));
        }

        // Sort by total descending
        result.sort((a, b) -> Long.compare(b.total(), a.total()));
        return result;
    }
}
