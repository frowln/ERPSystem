package com.privod.platform.modules.planning.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.BaselineType;
import com.privod.platform.modules.planning.domain.ScheduleBaseline;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.ScheduleBaselineRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.BaselineDiffResponse;
import com.privod.platform.modules.planning.web.dto.CreateScheduleBaselineRequest;
import com.privod.platform.modules.planning.web.dto.ScheduleBaselineResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleBaselineService {

    private final ScheduleBaselineRepository baselineRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<ScheduleBaselineResponse> findByProject(UUID projectId, Pageable pageable) {
        if (projectId == null) {
            return baselineRepository.findByDeletedFalse(pageable)
                    .map(ScheduleBaselineResponse::fromEntity);
        }
        return baselineRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ScheduleBaselineResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ScheduleBaselineResponse findById(UUID id) {
        ScheduleBaseline baseline = getBaselineOrThrow(id);
        return ScheduleBaselineResponse.fromEntity(baseline);
    }

    @Transactional
    public ScheduleBaselineResponse create(CreateScheduleBaselineRequest request) {
        ScheduleBaseline baseline = ScheduleBaseline.builder()
                .projectId(request.projectId())
                .name(request.name())
                .baselineType(request.baselineType() != null ? request.baselineType() : BaselineType.ORIGINAL)
                .baselineDate(request.baselineDate())
                .snapshotData(request.snapshotData())
                .createdById(request.createdById())
                .notes(request.notes())
                .build();

        baseline = baselineRepository.save(baseline);
        auditService.logCreate("ScheduleBaseline", baseline.getId());

        log.info("Базовый план создан: {} ({}) для проекта {}",
                baseline.getName(), baseline.getId(), baseline.getProjectId());
        return ScheduleBaselineResponse.fromEntity(baseline);
    }

    @Transactional
    public void delete(UUID id) {
        ScheduleBaseline baseline = getBaselineOrThrow(id);
        baseline.softDelete();
        baselineRepository.save(baseline);
        auditService.logDelete("ScheduleBaseline", id);
        log.info("Базовый план удалён: {} ({})", baseline.getName(), id);
    }

    /**
     * P2-PRJ-2: Compare a saved baseline against current WBS node state.
     * Returns per-node deltas: startDate slip, endDate slip, duration change, status (ADDED/REMOVED/CHANGED/UNCHANGED).
     */
    @Transactional(readOnly = true)
    public BaselineDiffResponse compareWithCurrent(UUID baselineId) {
        ScheduleBaseline baseline = getBaselineOrThrow(baselineId);
        UUID projectId = baseline.getProjectId();

        // Load current WBS nodes
        List<WbsNode> currentNodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderByCode(projectId);
        Map<String, WbsNode> currentByCode = currentNodes.stream()
                .filter(n -> n.getCode() != null)
                .collect(Collectors.toMap(WbsNode::getCode, n -> n, (a, b) -> a));
        Map<String, WbsNode> currentByName = currentNodes.stream()
                .collect(Collectors.toMap(WbsNode::getName, n -> n, (a, b) -> a));

        // Parse snapshot JSON — list of {code, name, plannedStartDate, plannedEndDate, duration}
        List<Map<String, Object>> snapshotItems = new ArrayList<>();
        if (baseline.getSnapshotData() != null && !baseline.getSnapshotData().isBlank()) {
            try {
                snapshotItems = objectMapper.readValue(baseline.getSnapshotData(),
                        new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception e) {
                log.warn("Could not parse snapshotData for baseline {}: {}", baselineId, e.getMessage());
            }
        }

        List<BaselineDiffResponse.NodeDiff> diffs = new ArrayList<>();
        for (Map<String, Object> snap : snapshotItems) {
            String code = (String) snap.get("code");
            String name = (String) snap.get("name");
            String snapStartStr = (String) snap.get("plannedStartDate");
            String snapEndStr   = (String) snap.get("plannedEndDate");

            WbsNode current = code != null ? currentByCode.get(code) : null;
            if (current == null && name != null) current = currentByName.get(name);

            if (current == null) {
                diffs.add(BaselineDiffResponse.NodeDiff.removed(code, name));
                continue;
            }

            LocalDate snapStart = snapStartStr != null ? LocalDate.parse(snapStartStr) : null;
            LocalDate snapEnd   = snapEndStr   != null ? LocalDate.parse(snapEndStr)   : null;

            long startSlip = 0L, endSlip = 0L;
            if (snapStart != null && current.getPlannedStartDate() != null) {
                startSlip = ChronoUnit.DAYS.between(snapStart, current.getPlannedStartDate());
            }
            if (snapEnd != null && current.getPlannedEndDate() != null) {
                endSlip = ChronoUnit.DAYS.between(snapEnd, current.getPlannedEndDate());
            }

            boolean changed = startSlip != 0 || endSlip != 0;
            diffs.add(BaselineDiffResponse.NodeDiff.of(
                    current.getId(), code != null ? code : current.getCode(), current.getName(),
                    snapStart, snapEnd,
                    current.getPlannedStartDate(), current.getPlannedEndDate(),
                    startSlip, endSlip, changed));
        }

        // Nodes present in current but not in snapshot (added after baseline)
        for (WbsNode node : currentNodes) {
            boolean inSnapshot = snapshotItems.stream().anyMatch(s ->
                    (node.getCode() != null && node.getCode().equals(s.get("code"))) ||
                    node.getName().equals(s.get("name")));
            if (!inSnapshot) {
                diffs.add(BaselineDiffResponse.NodeDiff.added(node.getId(), node.getCode(), node.getName(),
                        node.getPlannedStartDate(), node.getPlannedEndDate()));
            }
        }

        long slippedCount = diffs.stream().filter(d -> d.startSlipDays() > 0).count();
        long addedCount   = diffs.stream().filter(d -> "ADDED".equals(d.changeType())).count();
        long removedCount = diffs.stream().filter(d -> "REMOVED".equals(d.changeType())).count();

        log.info("Baseline diff for project {}: {} nodes total, {} slipped, {} added, {} removed",
                projectId, diffs.size(), slippedCount, addedCount, removedCount);

        return new BaselineDiffResponse(baselineId, projectId, baseline.getName(),
                baseline.getBaselineDate(), diffs, slippedCount, addedCount, removedCount);
    }

    private ScheduleBaseline getBaselineOrThrow(UUID id) {
        return baselineRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Базовый план не найден: " + id));
    }
}
