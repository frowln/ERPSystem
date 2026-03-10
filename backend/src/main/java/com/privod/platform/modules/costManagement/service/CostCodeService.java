package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CostCode;
import com.privod.platform.modules.costManagement.domain.CostCodeLevel;
import com.privod.platform.modules.costManagement.repository.CostCodeRepository;
import com.privod.platform.modules.costManagement.web.dto.CostCodeResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCostCodeRequest;
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

@Service("costMgmtCostCodeService")
@RequiredArgsConstructor
@Slf4j
public class CostCodeService {

    private final CostCodeRepository costCodeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CostCodeResponse> listByProject(UUID projectId, Pageable pageable) {
        if (projectId == null) {
            return costCodeRepository.findByDeletedFalse(pageable)
                    .map(CostCodeResponse::fromEntity);
        }
        return costCodeRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(CostCodeResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CostCodeResponse> listAllByProject(UUID projectId) {
        return costCodeRepository.findByProjectIdAndDeletedFalseOrderByCodeAsc(projectId)
                .stream()
                .map(CostCodeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CostCodeResponse getById(UUID id) {
        CostCode costCode = getCostCodeOrThrow(id);
        return CostCodeResponse.fromEntity(costCode);
    }

    @Transactional(readOnly = true)
    public List<CostCodeResponse> getChildren(UUID parentId) {
        return costCodeRepository.findByParentIdAndDeletedFalse(parentId)
                .stream()
                .map(CostCodeResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CostCodeResponse create(CreateCostCodeRequest request) {
        if (costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(request.projectId(), request.code())) {
            throw new IllegalArgumentException(
                    "Код затрат с кодом '" + request.code() + "' уже существует в данном проекте");
        }

        if (request.parentId() != null) {
            getCostCodeOrThrow(request.parentId());
        }

        CostCode costCode = CostCode.builder()
                .projectId(request.projectId())
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .parentId(request.parentId())
                .level(request.level() != null ? request.level() : CostCodeLevel.LEVEL1)
                .budgetAmount(request.budgetAmount() != null ? request.budgetAmount() : BigDecimal.ZERO)
                .build();

        costCode = costCodeRepository.save(costCode);
        auditService.logCreate("CostCode", costCode.getId());

        log.info("Cost code created: {} - {} ({})", costCode.getCode(), costCode.getName(), costCode.getId());
        return CostCodeResponse.fromEntity(costCode);
    }

    @Transactional
    public CostCodeResponse update(UUID id, UpdateCostCodeRequest request) {
        CostCode costCode = getCostCodeOrThrow(id);

        if (request.code() != null) {
            if (!request.code().equals(costCode.getCode()) &&
                    costCodeRepository.existsByProjectIdAndCodeAndDeletedFalse(costCode.getProjectId(), request.code())) {
                throw new IllegalArgumentException(
                        "Код затрат с кодом '" + request.code() + "' уже существует в данном проекте");
            }
            costCode.setCode(request.code());
        }
        if (request.name() != null) {
            costCode.setName(request.name());
        }
        if (request.description() != null) {
            costCode.setDescription(request.description());
        }
        if (request.parentId() != null) {
            getCostCodeOrThrow(request.parentId());
            costCode.setParentId(request.parentId());
        }
        if (request.level() != null) {
            costCode.setLevel(request.level());
        }
        if (request.budgetAmount() != null) {
            costCode.setBudgetAmount(request.budgetAmount());
        }
        if (request.isActive() != null) {
            costCode.setIsActive(request.isActive());
        }

        costCode = costCodeRepository.save(costCode);
        auditService.logUpdate("CostCode", costCode.getId(), "multiple", null, null);

        log.info("Cost code updated: {} ({})", costCode.getCode(), costCode.getId());
        return CostCodeResponse.fromEntity(costCode);
    }

    @Transactional
    public void delete(UUID id) {
        CostCode costCode = getCostCodeOrThrow(id);
        costCode.softDelete();
        costCodeRepository.save(costCode);
        auditService.logDelete("CostCode", id);

        log.info("Cost code deleted: {} ({})", costCode.getCode(), id);
    }

    private CostCode getCostCodeOrThrow(UUID id) {
        return costCodeRepository.findById(id)
                .filter(cc -> !cc.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Код затрат не найден: " + id));
    }
}
