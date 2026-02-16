package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateMaterialRequest;
import com.privod.platform.modules.warehouse.web.dto.MaterialResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateMaterialRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MaterialResponse> listMaterials(String search, MaterialCategory category, Pageable pageable) {
        Specification<Material> spec = Specification
                .where(MaterialSpecification.notDeleted())
                .and(MaterialSpecification.hasCategory(category))
                .and(MaterialSpecification.searchByNameOrCode(search));

        return materialRepository.findAll(spec, pageable).map(MaterialResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialResponse getMaterial(UUID id) {
        Material material = getMaterialOrThrow(id);
        return MaterialResponse.fromEntity(material);
    }

    @Transactional
    public MaterialResponse createMaterial(CreateMaterialRequest request) {
        if (request.code() != null && materialRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Материал с кодом '" + request.code() + "' уже существует");
        }

        Material material = Material.builder()
                .name(request.name())
                .code(request.code())
                .category(request.category())
                .unitOfMeasure(request.unitOfMeasure())
                .description(request.description())
                .minStockLevel(request.minStockLevel() != null ? request.minStockLevel() : BigDecimal.ZERO)
                .currentPrice(request.currentPrice() != null ? request.currentPrice() : BigDecimal.ZERO)
                .active(true)
                .build();

        material = materialRepository.save(material);
        auditService.logCreate("Material", material.getId());

        log.info("Material created: {} - {} ({})", material.getCode(), material.getName(), material.getId());
        return MaterialResponse.fromEntity(material);
    }

    @Transactional
    public MaterialResponse updateMaterial(UUID id, UpdateMaterialRequest request) {
        Material material = getMaterialOrThrow(id);

        if (request.name() != null) {
            material.setName(request.name());
        }
        if (request.code() != null) {
            if (!request.code().equals(material.getCode())
                    && materialRepository.existsByCodeAndDeletedFalse(request.code())) {
                throw new IllegalArgumentException("Материал с кодом '" + request.code() + "' уже существует");
            }
            material.setCode(request.code());
        }
        if (request.category() != null) {
            material.setCategory(request.category());
        }
        if (request.unitOfMeasure() != null) {
            material.setUnitOfMeasure(request.unitOfMeasure());
        }
        if (request.description() != null) {
            material.setDescription(request.description());
        }
        if (request.minStockLevel() != null) {
            material.setMinStockLevel(request.minStockLevel());
        }
        if (request.currentPrice() != null) {
            material.setCurrentPrice(request.currentPrice());
        }
        if (request.active() != null) {
            material.setActive(request.active());
        }

        material = materialRepository.save(material);
        auditService.logUpdate("Material", material.getId(), "multiple", null, null);

        log.info("Material updated: {} ({})", material.getName(), material.getId());
        return MaterialResponse.fromEntity(material);
    }

    @Transactional
    public void deleteMaterial(UUID id) {
        Material material = getMaterialOrThrow(id);
        material.softDelete();
        materialRepository.save(material);
        auditService.logDelete("Material", id);

        log.info("Material deleted: {} ({})", material.getName(), id);
    }

    Material getMaterialOrThrow(UUID id) {
        return materialRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Материал не найден: " + id));
    }
}
