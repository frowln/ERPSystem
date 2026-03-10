package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.CostCode;
import com.privod.platform.modules.finance.repository.CostCodeRepository;
import com.privod.platform.modules.finance.web.dto.CostCodeResponse;
import com.privod.platform.modules.finance.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.finance.web.dto.UpdateCostCodeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service("financeCostCodeService")
@RequiredArgsConstructor
public class CostCodeService {

    private final CostCodeRepository costCodeRepository;

    @Transactional(readOnly = true)
    public List<CostCodeResponse> getAllCostCodes(UUID parentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<CostCode> codes;
        if (parentId != null) {
            codes = costCodeRepository.findByOrganizationIdAndParentIdAndDeletedFalse(orgId, parentId);
        } else {
            codes = costCodeRepository.findByOrganizationIdAndDeletedFalseOrderByCodeAsc(orgId);
        }
        return codes.stream().map(CostCodeResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<CostCodeResponse> getTree() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<CostCode> all = costCodeRepository.findByOrganizationIdAndDeletedFalseOrderByCodeAsc(orgId);
        return buildTree(all);
    }

    @Transactional(readOnly = true)
    public CostCodeResponse getCostCode(UUID id) {
        CostCode entity = costCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cost code not found: " + id));
        return CostCodeResponse.fromEntity(entity);
    }

    @Transactional
    public CostCodeResponse createCostCode(CreateCostCodeRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (costCodeRepository.existsByOrganizationIdAndCodeAndDeletedFalse(orgId, request.code())) {
            throw new RuntimeException("Cost code already exists: " + request.code());
        }

        int level = 0;
        if (request.parentId() != null) {
            CostCode parent = costCodeRepository.findById(request.parentId())
                    .orElseThrow(() -> new RuntimeException("Parent cost code not found: " + request.parentId()));
            level = parent.getLevel() + 1;
        }

        CostCode entity = CostCode.builder()
                .organizationId(orgId)
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .parentId(request.parentId())
                .level(level)
                .standard(request.standard() != null ? request.standard() : "CUSTOM")
                .isActive(true)
                .build();

        entity = costCodeRepository.save(entity);
        return CostCodeResponse.fromEntity(entity);
    }

    @Transactional
    public CostCodeResponse updateCostCode(UUID id, UpdateCostCodeRequest request) {
        CostCode entity = costCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cost code not found: " + id));

        if (request.name() != null) {
            entity.setName(request.name());
        }
        if (request.description() != null) {
            entity.setDescription(request.description());
        }
        if (request.isActive() != null) {
            entity.setIsActive(request.isActive());
        }

        entity = costCodeRepository.save(entity);
        return CostCodeResponse.fromEntity(entity);
    }

    @Transactional
    public void deleteCostCode(UUID id) {
        CostCode entity = costCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cost code not found: " + id));
        entity.softDelete();
        costCodeRepository.save(entity);
    }

    @Transactional
    public void seedStandard(String standard) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Check if already seeded
        List<CostCode> existing = costCodeRepository.findByOrganizationIdAndStandardAndDeletedFalse(orgId, standard);
        if (!existing.isEmpty()) {
            return; // Already seeded
        }

        List<String[]> divisions;
        if ("CSI".equalsIgnoreCase(standard)) {
            divisions = getCsiDivisions();
        } else if ("GESN".equalsIgnoreCase(standard)) {
            divisions = getGesnGroups();
        } else {
            throw new RuntimeException("Unknown standard: " + standard + ". Supported: CSI, GESN");
        }

        for (String[] div : divisions) {
            CostCode code = CostCode.builder()
                    .organizationId(orgId)
                    .code(div[0])
                    .name(div[1])
                    .level(0)
                    .standard(standard.toUpperCase())
                    .isActive(true)
                    .build();
            costCodeRepository.save(code);
        }
    }

    // ---------- Private helpers ----------

    private List<CostCodeResponse> buildTree(List<CostCode> all) {
        Map<UUID, List<CostCode>> childrenMap = new LinkedHashMap<>();
        List<CostCode> roots = new ArrayList<>();

        for (CostCode cc : all) {
            if (cc.getParentId() == null) {
                roots.add(cc);
            } else {
                childrenMap.computeIfAbsent(cc.getParentId(), k -> new ArrayList<>()).add(cc);
            }
        }

        return roots.stream()
                .map(root -> buildNode(root, childrenMap))
                .toList();
    }

    private CostCodeResponse buildNode(CostCode node, Map<UUID, List<CostCode>> childrenMap) {
        List<CostCode> children = childrenMap.getOrDefault(node.getId(), List.of());
        List<CostCodeResponse> childResponses = children.stream()
                .map(child -> buildNode(child, childrenMap))
                .toList();
        return CostCodeResponse.fromEntityWithChildren(node, childResponses.isEmpty() ? null : childResponses);
    }

    private List<String[]> getCsiDivisions() {
        return List.of(
                new String[]{"01", "General Requirements"},
                new String[]{"02", "Existing Conditions"},
                new String[]{"03", "Concrete"},
                new String[]{"04", "Masonry"},
                new String[]{"05", "Metals"},
                new String[]{"06", "Wood, Plastics, Composites"},
                new String[]{"07", "Thermal & Moisture Protection"},
                new String[]{"08", "Openings"},
                new String[]{"09", "Finishes"},
                new String[]{"10", "Specialties"},
                new String[]{"11", "Equipment"},
                new String[]{"12", "Furnishings"},
                new String[]{"13", "Special Construction"},
                new String[]{"14", "Conveying Equipment"},
                new String[]{"21", "Fire Suppression"},
                new String[]{"22", "Plumbing"},
                new String[]{"23", "HVAC"},
                new String[]{"25", "Integrated Automation"},
                new String[]{"26", "Electrical"},
                new String[]{"27", "Communications"},
                new String[]{"28", "Electronic Safety & Security"},
                new String[]{"31", "Earthwork"},
                new String[]{"32", "Exterior Improvements"},
                new String[]{"33", "Utilities"}
        );
    }

    private List<String[]> getGesnGroups() {
        return List.of(
                new String[]{"01", "Земляные работы"},
                new String[]{"06", "Фундаменты и стены подземной части зданий"},
                new String[]{"07", "Бетонные и железобетонные конструкции"},
                new String[]{"08", "Конструкции из кирпича и блоков"},
                new String[]{"09", "Металлические конструкции"},
                new String[]{"10", "Деревянные конструкции"},
                new String[]{"11", "Полы"},
                new String[]{"12", "Кровли"},
                new String[]{"15", "Отделочные работы"},
                new String[]{"16", "Сантехнические работы"},
                new String[]{"20", "Вентиляция и кондиционирование"}
        );
    }
}
