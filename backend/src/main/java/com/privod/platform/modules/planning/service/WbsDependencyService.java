package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.DependencyType;
import com.privod.platform.modules.planning.domain.WbsDependency;
import com.privod.platform.modules.planning.repository.WbsDependencyRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateWbsDependencyRequest;
import com.privod.platform.modules.planning.web.dto.WbsDependencyResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WbsDependencyService {

    private final WbsDependencyRepository dependencyRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<WbsDependencyResponse> findByNodeId(UUID nodeId) {
        return dependencyRepository.findByNodeId(nodeId)
                .stream()
                .map(WbsDependencyResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WbsDependencyResponse> findByProjectId(UUID projectId) {
        return dependencyRepository.findByProjectId(projectId)
                .stream()
                .map(WbsDependencyResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WbsDependencyResponse> findPredecessors(UUID nodeId) {
        return dependencyRepository.findBySuccessorIdAndDeletedFalse(nodeId)
                .stream()
                .map(WbsDependencyResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WbsDependencyResponse> findSuccessors(UUID nodeId) {
        return dependencyRepository.findByPredecessorIdAndDeletedFalse(nodeId)
                .stream()
                .map(WbsDependencyResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WbsDependencyResponse create(CreateWbsDependencyRequest request) {
        if (request.predecessorId().equals(request.successorId())) {
            throw new IllegalArgumentException("Узел WBS не может зависеть от самого себя");
        }

        wbsNodeRepository.findById(request.predecessorId())
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Узел-предшественник не найден: " + request.predecessorId()));

        wbsNodeRepository.findById(request.successorId())
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Узел-последователь не найден: " + request.successorId()));

        WbsDependency dependency = WbsDependency.builder()
                .predecessorId(request.predecessorId())
                .successorId(request.successorId())
                .dependencyType(request.dependencyType() != null ? request.dependencyType() : DependencyType.FINISH_TO_START)
                .lagDays(request.lagDays() != null ? request.lagDays() : 0)
                .build();

        dependency = dependencyRepository.save(dependency);
        auditService.logCreate("WbsDependency", dependency.getId());

        log.info("Зависимость WBS создана: {} -> {} ({})",
                dependency.getPredecessorId(), dependency.getSuccessorId(), dependency.getId());
        return WbsDependencyResponse.fromEntity(dependency);
    }

    @Transactional
    public void delete(UUID id) {
        WbsDependency dependency = dependencyRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Зависимость WBS не найдена: " + id));

        dependency.softDelete();
        dependencyRepository.save(dependency);
        auditService.logDelete("WbsDependency", id);
        log.info("Зависимость WBS удалена: {}", id);
    }
}
